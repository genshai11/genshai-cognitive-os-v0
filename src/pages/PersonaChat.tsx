import { useParams, Navigate } from 'react-router-dom';
import { PersonaChatInterface } from '@/components/chat/PersonaChatInterface';
import { getPersonaAdvisor } from '@/lib/persona-advisors';

const PersonaChat = () => {
  const { personaId } = useParams<{ personaId: string }>();
  const persona = personaId ? getPersonaAdvisor(personaId) : undefined;

  if (!persona) {
    return <Navigate to="/advisors" replace />;
  }

  return <PersonaChatInterface persona={persona} />;
};

export default PersonaChat;
