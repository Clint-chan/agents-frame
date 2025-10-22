#!/usr/bin/env python3
"""
RAGFlow聊天助手项目启动脚本
支持后端、前端、全栈启动模式
"""
import os
import sys
import subprocess
import argparse
import time
import signal
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent
BACKEND_DIR = PROJECT_ROOT / "backend" / "app"
FRONTEND_DIR = PROJECT_ROOT / "frontend"


def print_banner():
    """打印项目横幅"""
    banner = """
╔══════════════════════════════════════════════════════════════╗
║                RAGFlow聊天助手项目                             ║
║                   统一启动脚本                                ║
║                                                              ║
║  🤖 基于RAGFlow的智能知识库问答系统                            ║
║  🚀 支持后端API、前端界面、全栈开发                            ║
╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)


def find_npm_command():
    """查找npm命令路径"""
    try:
        # 首先尝试直接使用npm
        result = subprocess.run(["npm", "--version"], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            return "npm"
    except:
        pass
    
    # 尝试使用where命令查找npm
    try:
        result = subprocess.run(["where", "npm"], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            npm_path = result.stdout.strip().split('\n')[0]
            return npm_path
    except:
        pass
    
    # 尝试常见的npm路径
    possible_paths = [
        r"C:\Program Files\nodejs\npm.cmd",
        r"C:\Program Files (x86)\nodejs\npm.cmd",
        r"C:\nodejs\npm.cmd",
        os.path.expanduser(r"~\AppData\Roaming\npm\npm.cmd"),
        os.path.expanduser(r"~\scoop\apps\nodejs\current\npm.cmd"),
    ]
    
    for path in possible_paths:
        if Path(path).exists():
            return path
    
    return None


def check_dependencies():
    """检查依赖是否安装"""
    print("🔍 检查项目依赖...")
    
    # 检查虚拟环境
    venv_python = PROJECT_ROOT / "backend" / ".venv" / "Scripts" / "python.exe"
    if venv_python.exists():
        print("  ✅ 后端虚拟环境存在")
    else:
        print("  ❌ 后端虚拟环境不存在")
        print(f"     请在 {PROJECT_ROOT / 'backend'} 目录创建虚拟环境")
        return False
    
    # 检查Python依赖
    backend_requirements = BACKEND_DIR.parent / "requirements.txt"
    if backend_requirements.exists():
        print("  ✅ 后端requirements.txt存在")
    else:
        print("  ❌ 后端requirements.txt不存在")
        return False
    
    # 检查npm命令
    npm_cmd = find_npm_command()
    if npm_cmd:
        print(f"  ✅ npm命令可用: {npm_cmd}")
    else:
        print("  ❌ npm命令不可用，请安装Node.js")
        return False
    
    # 检查Node.js依赖
    frontend_package = FRONTEND_DIR / "package.json"
    if frontend_package.exists():
        print("  ✅ 前端package.json存在")
    else:
        print("  ❌ 前端package.json不存在")
        return False
    
    print("✅ 依赖检查通过")
    return True


def start_backend(port=8000, host="0.0.0.0"):
    """启动后端服务"""
    print(f"\n🚀 启动后端服务 (http://{host}:{port})...")
    
    try:
        # 使用新的虚拟环境Python路径
        venv_python = PROJECT_ROOT / "backend" / ".venv" / "Scripts" / "python.exe"
        
        if not venv_python.exists():
            print(f"❌ 虚拟环境不存在: {venv_python}")
            print("请先创建虚拟环境:")
            print(f"  cd {PROJECT_ROOT / 'backend'}")
            print("  python -m venv .venv")
            print("  .venv\\Scripts\\activate")
            print("  pip install fastapi uvicorn[standard] python-multipart")
            return None
        
        # 检查main.py是否存在
        main_file = BACKEND_DIR / "main.py"
        if not main_file.exists():
            print(f"❌ main.py不存在: {main_file}")
            return None
        
        # 启动后端服务
        cmd = [
            str(venv_python), "-m", "uvicorn",
            "main:app",
            "--host", host,
            "--port", str(port),
            "--reload",
            "--log-level", "info"
        ]
        
        print(f"📝 执行命令: {' '.join(cmd)}")
        print(f"📁 工作目录: {BACKEND_DIR}")
        print(f"🐍 Python路径: {venv_python}")
        
        # 切换到后端目录并启动
        process = subprocess.Popen(cmd, cwd=BACKEND_DIR)
        return process
        
    except Exception as e:
        print(f"❌ 启动后端服务失败: {e}")
        return None


def start_frontend(port=3000, backend_base_url="http://localhost:8000"):
    """启动前端服务（Next.js 15）
    会自动设置 NEXT_PUBLIC_API_BASE_URL，供前端通过 /api 代理或直连使用
    """
    print(f"\n🌐 启动前端服务 (http://localhost:{port})...")
    print(f"🔧 NEXT_PUBLIC_API_BASE_URL = {backend_base_url}")

    try:
        # 查找npm命令
        npm_cmd = find_npm_command()
        if not npm_cmd:
            print("❌ 找不到npm命令，请安装Node.js")
            return None

        print(f"🔍 使用npm: {npm_cmd}")

        # 检查前端目录是否存在
        if not FRONTEND_DIR.exists():
            print(f"❌ 前端目录不存在: {FRONTEND_DIR}")
            return None

        # 检查package.json是否存在
        package_json = FRONTEND_DIR / "package.json"
        if not package_json.exists():
            print(f"❌ package.json不存在: {package_json}")
            return None

        # 检查是否已安装依赖
        node_modules = FRONTEND_DIR / "node_modules"
        if not node_modules.exists():
            print("📦 安装前端依赖...")
            install_cmd = [npm_cmd, "install"]
            result = subprocess.run(install_cmd, cwd=FRONTEND_DIR, shell=True)
            if result.returncode != 0:
                print("❌ 前端依赖安装失败")
                return None

        # 启动前端服务（设置必要的环境变量）
        env = os.environ.copy()
        env["NEXT_TELEMETRY_DISABLED"] = "1"
        env["NEXT_PUBLIC_API_BASE_URL"] = backend_base_url

        cmd = [npm_cmd, "run", "dev", "--", "--port", str(port)]

        print(f"📝 执行命令: {' '.join(cmd)}")
        print(f"📁 工作目录: {FRONTEND_DIR}")

        process = subprocess.Popen(cmd, cwd=FRONTEND_DIR, shell=True, env=env)
        return process

    except Exception as e:
        print(f"❌ 启动前端服务失败: {e}")
        return None


def start_fullstack(backend_port=8000, host="0.0.0.0", frontend_port=3000):
    """启动全栈服务"""
    print("\n🚀 启动全栈服务...")
    
    processes = []
    
    try:
        # 启动后端
        backend_process = start_backend(port=backend_port, host=host)
        if backend_process:
            processes.append(("backend", backend_process))
            print("✅ 后端服务启动成功")
        else:
            print("❌ 后端服务启动失败")
            return
        
        # 等待后端启动
        print("⏳ 等待后端服务启动...")
        time.sleep(3)
        
        # 启动前端
        frontend_process = start_frontend(port=frontend_port, backend_base_url=f"http://localhost:{backend_port}")
        if frontend_process:
            processes.append(("frontend", frontend_process))
            print("✅ 前端服务启动成功")
        else:
            print("❌ 前端服务启动失败")
            # 停止后端
            backend_process.terminate()
            return
        
        print("\n🎉 全栈服务启动完成！")
        print("📊 服务状态:")
        print(f"  - 后端API: http://localhost:{backend_port}")
        print(f"  - 前端界面: http://localhost:{frontend_port}")
        print(f"  - API文档: http://localhost:{backend_port}/docs")
        print("\n按 Ctrl+C 停止所有服务")
        
        # 等待用户中断
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n👋 正在停止所有服务...")
            for name, process in processes:
                print(f"  停止{name}服务...")
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
            print("✅ 所有服务已停止")
            
    except Exception as e:
        print(f"❌ 启动全栈服务失败: {e}")
        # 清理进程
        for name, process in processes:
            try:
                process.terminate()
            except:
                pass


def install_dependencies():
    """安装项目依赖"""
    print("\n📦 安装项目依赖...")
    
    # 安装后端依赖
    print("📦 安装后端依赖...")
    try:
        venv_python = PROJECT_ROOT / "backend" / ".venv" / "Scripts" / "python.exe"
        backend_requirements = BACKEND_DIR.parent / "requirements.txt"
        
        if not venv_python.exists():
            print("❌ 虚拟环境不存在，请先创建虚拟环境")
            print("创建步骤:")
            print(f"  cd {PROJECT_ROOT / 'backend'}")
            print("  python -m venv .venv")
            print("  .venv\\Scripts\\activate")
            return False
        
        if not backend_requirements.exists():
            print("❌ requirements.txt不存在，创建默认文件...")
            with open(backend_requirements, 'w', encoding='utf-8') as f:
                f.write("""fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pydantic==2.5.0
python-dotenv==1.0.0
""")
        
        cmd = [str(venv_python), "-m", "pip", "install", "-r", str(backend_requirements)]
        result = subprocess.run(cmd)
        if result.returncode == 0:
            print("✅ 后端依赖安装完成")
        else:
            print("❌ 后端依赖安装失败")
            return False
    except Exception as e:
        print(f"❌ 后端依赖安装失败: {e}")
        return False
    
    # 安装前端依赖
    print("📦 安装前端依赖...")
    try:
        npm_cmd = find_npm_command()
        if not npm_cmd:
            print("❌ 找不到npm命令，请安装Node.js")
            return False
        
        cmd = [npm_cmd, "install"]
        result = subprocess.run(cmd, cwd=FRONTEND_DIR, shell=True)
        if result.returncode == 0:
            print("✅ 前端依赖安装完成")
        else:
            print("❌ 前端依赖安装失败")
            return False
    except Exception as e:
        print(f"❌ 前端依赖安装失败: {e}")
        return False
    
    print("✅ 所有依赖安装完成")
    return True


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="RAGFlow聊天助手项目启动脚本")
    parser.add_argument(
        "mode",
        choices=["backend", "frontend", "fullstack", "install", "check"],
        help="启动模式: backend(后端), frontend(前端), fullstack(全栈), install(安装依赖), check(检查环境)"
    )
    parser.add_argument("--backend-port", type=int, default=8000, help="后端端口 (默认: 8000)")
    parser.add_argument("--frontend-port", type=int, default=3000, help="前端端口 (默认: 3000)")
    parser.add_argument("--host", default="0.0.0.0", help="后端主机 (默认: 0.0.0.0)")
    
    args = parser.parse_args()
    
    print_banner()
    
    # 根据模式执行
    if args.mode == "check":
        if check_dependencies():
            print("\n✅ 环境检查完成，系统就绪！")
        else:
            print("\n❌ 环境检查失败，请先安装依赖")
            sys.exit(1)
            
    elif args.mode == "install":
        if install_dependencies():
            print("\n✅ 依赖安装完成！")
        else:
            print("\n❌ 依赖安装失败")
            sys.exit(1)
            
    elif args.mode == "backend":
        process = start_backend(args.backend_port, args.host)
        if process:
            try:
                process.wait()
            except KeyboardInterrupt:
                print("\n👋 后端服务已停止")
                process.terminate()
        else:
            print("\n❌ 后端服务启动失败")
        
    elif args.mode == "frontend":
        process = start_frontend(args.frontend_port, backend_base_url=f"http://localhost:{args.backend_port}")
        if process:
            try:
                process.wait()
            except KeyboardInterrupt:
                print("\n👋 前端服务已停止")
                process.terminate()
        else:
            print("\n❌ 前端服务启动失败")
        
    elif args.mode == "fullstack":
        start_fullstack(args.backend_port, args.host, args.frontend_port)
    
    print("\n👋 启动脚本执行完成")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 程序已退出")
    except Exception as e:
        print(f"\n❌ 程序错误: {e}")
        sys.exit(1)
