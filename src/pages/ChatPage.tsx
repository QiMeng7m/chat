import MessageList from '../components/chat/MessageList'
import DocGenerateForm from '../components/chat/DocGenerateForm'
import { useChat } from '../components/chat/ChatContext'

export default function ChatPage() {
  const { messages, currentFeature } = useChat()
  const isFormFeature = currentFeature?.uiSchema?.type === 'form'

  if (isFormFeature && currentFeature) {
    return (
      <>
        {messages.length > 0 ? <MessageList messages={messages} /> : null}
        <DocGenerateForm feature={currentFeature} />
      </>
    )
  }

  return <MessageList messages={messages} />
}
