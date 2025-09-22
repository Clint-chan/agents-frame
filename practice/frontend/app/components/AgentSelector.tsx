import React, { useEffect, useState } from 'react';
import { Select } from 'antd';

interface AgentOption { value: string; label: string }
interface AgentSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({ value, onChange }) => {
  const [options, setOptions] = useState<AgentOption[]>([{ value: 'knowledge-chat', label: '知识库聊天助手' }]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/chat/agents`);
        const data = await resp.json();
        if (data?.code === 200 && Array.isArray(data?.data?.agents)) {
          const opts = data.data.agents.map((a: any) => ({ value: a.id || a.agent_id, label: a.name || a.title || a.id }));
          if (opts.length > 0) setOptions(opts);
        }
      } catch (e) {
        // ignore, keep default
      }
    };
    fetchAgents();
  }, []);

  return (
    <Select
      value={value}
      className="ml-2 mr-5 w-40"
      onChange={onChange}
      options={options}
      placeholder="选择Agent"
    />
  );
};

export default AgentSelector;