#
#  Copyright 2024 The InfiniFlow Authors. All Rights Reserved.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#
import os
import sys
import logging
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from flask import Blueprint, Flask
from werkzeug.wrappers.request import Request
from flask_cors import CORS
from flasgger import Swagger
from itsdangerous.url_safe import URLSafeTimedSerializer as Serializer

from api.db import StatusEnum
from api.db.db_models import close_connection
from api.db.services import UserService
from api.db.services.user_service import UserTenantService
from api.utils import CustomJSONEncoder, commands

from flask_mail import Mail
from flask_session import Session
from flask_login import LoginManager
from api import settings
from api.utils.api_utils import server_error_response
from api.constants import API_VERSION

__all__ = ["app"]

Request.json = property(lambda self: self.get_json(force=True, silent=True))

app = Flask(__name__)
smtp_mail_server = Mail()

# Add this at the beginning of your file to configure Swagger UI
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: True,  # Include all endpoints
            "model_filter": lambda tag: True,  # Include all models
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/",
}

swagger = Swagger(
    app,
    config=swagger_config,
    template={
        "swagger": "2.0",
        "info": {
            "title": "RAGFlow API",
            "description": "",
            "version": "1.0.0",
        },
        "securityDefinitions": {
            "ApiKeyAuth": {"type": "apiKey", "name": "Authorization", "in": "header"}
        },
    },
)

CORS(app, supports_credentials=True, max_age=2592000)
app.url_map.strict_slashes = False
app.json_encoder = CustomJSONEncoder
app.errorhandler(Exception)(server_error_response)

## convince for dev and debug
# app.config["LOGIN_DISABLED"] = True
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["MAX_CONTENT_LENGTH"] = int(
    os.environ.get("MAX_CONTENT_LENGTH", 1024 * 1024 * 1024)
)

Session(app)
login_manager = LoginManager()
login_manager.init_app(app)

commands.register_commands(app)

# Monkey patch UserTenantService to support API Token users
_original_user_tenant_query = UserTenantService.query

def patched_user_tenant_query(user_id=None, **kwargs):
    """
    增强的UserTenantService.query方法，支持API Token用户
    """
    # 如果user_id看起来像tenant_id（32位字符），直接返回模拟的tenant对象
    if user_id and len(str(user_id)) == 32 and not kwargs:
        class MockTenant:
            def __init__(self, tenant_id):
                self.id = f"mock_user_tenant_{tenant_id}"
                self.tenant_id = tenant_id
                self.user_id = tenant_id
                self.role = "owner"  # API Token用户默认为owner角色
                self.invited_by = tenant_id
                self.status = "1"  # 有效状态
        return [MockTenant(user_id)]

    # 否则使用原始查询方法
    return _original_user_tenant_query(user_id=user_id, **kwargs)

UserTenantService.query = patched_user_tenant_query


def search_pages_path(pages_dir):
    app_path_list = [
        path for path in pages_dir.glob("*_app.py") if not path.name.startswith(".")
    ]
    api_path_list = [
        path for path in pages_dir.glob("*sdk/*.py") if not path.name.startswith(".")
    ]
    app_path_list.extend(api_path_list)
    return app_path_list


def register_page(page_path):
    path = f"{page_path}"

    page_name = page_path.stem.removesuffix("_app")
    module_name = ".".join(
        page_path.parts[page_path.parts.index("api"): -1] + (page_name,)
    )

    spec = spec_from_file_location(module_name, page_path)
    page = module_from_spec(spec)
    page.app = app
    page.manager = Blueprint(page_name, module_name)
    sys.modules[module_name] = page
    spec.loader.exec_module(page)
    page_name = getattr(page, "page_name", page_name)
    sdk_path = "\\sdk\\" if sys.platform.startswith("win") else "/sdk/"
    url_prefix = (
        f"/api/{API_VERSION}" if sdk_path in path else f"/{API_VERSION}/{page_name}"
    )

    app.register_blueprint(page.manager, url_prefix=url_prefix)
    return url_prefix


pages_dir = [
    Path(__file__).parent,
    Path(__file__).parent.parent / "api" / "apps",
    Path(__file__).parent.parent / "api" / "apps" / "sdk",
]

client_urls_prefix = [
    register_page(path) for dir in pages_dir for path in search_pages_path(dir)
]


@login_manager.request_loader
def load_user(web_request):
    authorization = web_request.headers.get("Authorization")
    if not authorization:
        return None

    # 方式1: RESTful API Token鉴权 (Bearer格式)
    if authorization.startswith("Bearer "):
        try:
            from api.db.db_models import APIToken

            authorization_list = authorization.split()
            if len(authorization_list) >= 2:
                token = authorization_list[1]
                objs = APIToken.query(token=token)
                if objs:
                    # 创建虚拟用户对象，让现有Web API代码能正常工作
                    class APITokenUser:
                        def __init__(self, tenant_id):
                            self.id = tenant_id  # 直接使用tenant_id作为user.id
                            self.tenant_id = tenant_id
                            self.is_authenticated = True
                            self.is_active = True
                            self.is_anonymous = False

                        def get_id(self):
                            return self.tenant_id

                    return APITokenUser(objs[0].tenant_id)
        except Exception as e:
            logging.warning(f"API token authentication failed: {e}")

    # 方式2: Web Session Token鉴权 (JWT格式)
    try:
        jwt = Serializer(secret_key=settings.SECRET_KEY)
        access_token = str(jwt.loads(authorization))

        if not access_token or not access_token.strip():
            logging.warning("Authentication attempt with empty access token")
            return None

        # Access tokens should be UUIDs (32 hex characters)
        if len(access_token.strip()) < 32:
            logging.warning(f"Authentication attempt with invalid token format: {len(access_token)} chars")
            return None

        user = UserService.query(
            access_token=access_token, status=StatusEnum.VALID.value
        )
        if user:
            if not user[0].access_token or not user[0].access_token.strip():
                logging.warning(f"User {user[0].email} has empty access_token in database")
                return None
            return user[0]
        else:
            return None
    except Exception as e:
        logging.warning(f"Session token authentication failed: {e}")
        return None


@app.teardown_request
def _db_close(exc):
    close_connection()
