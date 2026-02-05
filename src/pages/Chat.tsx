import { useParams, Navigate } from 'react-router-dom';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { getAdvisor } from '@/lib/advisors';

const Chat = () => {
  const { advisorId } = useParams<{ advisorId: string }>();
  const advisor = advisorId ? getAdvisor(advisorId) : undefined;

  if (!advisor) {
    return <Navigate to="/advisors" replace />;
  }

  return <ChatInterface advisor={advisor} />;
};

export default Chat;
