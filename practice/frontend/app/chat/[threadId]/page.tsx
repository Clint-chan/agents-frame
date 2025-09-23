import ChatComponent from "../components/ChatComponent";

// Be permissive on typing to avoid Next.js type inference cache issues
export default async function ChatPage(props: any) {
  const params = await props.params;
  const threadId = params?.threadId as string;
  return <ChatComponent threadId={threadId} />;
}
