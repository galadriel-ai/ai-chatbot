import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { useState } from 'react';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (chat.visibility === 'private') {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  const [transactionDetails, setTransactionDetails] = useState(null);

  const handleNewMessage = (message) => {
    try {
      const content = JSON.parse(message.content);
      if (content.transaction_data) {
        setTransactionDetails(content);
      }
    } catch (e) {
      // Not a JSON message or doesn't contain transaction data
    }
  };

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          id={chat.id}
          initialMessages={convertToUIMessages(messagesFromDb)}
          selectedChatModel={DEFAULT_CHAT_MODEL}
          selectedVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}
          onNewMessage={handleNewMessage}
        />
        <DataStreamHandler id={id} />
        <ConnectWalletButton 
          transactionDetails={transactionDetails}
          onTransactionComplete={(signature) => {
            console.log('Transaction completed:', signature);
            setTransactionDetails(null); // Hide the button after completion
          }}
        />
      </>
    );
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedChatModel={chatModelFromCookie.value}
        selectedVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
        onNewMessage={handleNewMessage}
      />
      <DataStreamHandler id={id} />
      <ConnectWalletButton 
        transactionDetails={transactionDetails}
        onTransactionComplete={(signature) => {
          console.log('Transaction completed:', signature);
          setTransactionDetails(null); // Hide the button after completion
        }}
      />
    </>
  );
}
