import React, { useEffect, useState, useRef } from 'react';

const SOCKET_URL = "wss://news.treeofalpha.com/ws";

function trimQuote(originalString) {
  const splitString = originalString.split("Quote [");
  return splitString.shift().trim();
}

const App = () => {
  const [messages, setMessages] = useState([]);
  const webSocket = useRef(null);
  const reconnectTimeout = useRef(null);

  const connect = () => {
    webSocket.current = new WebSocket(SOCKET_URL);

    webSocket.current.onopen = () => {
      console.log('Connected to ' + SOCKET_URL);

      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }

      setInterval(() => {
        webSocket.current.send(JSON.stringify({type: 'ping'}));
      }, 5000);

    };

    webSocket.current.onmessage = (message) => {
      const data = JSON.parse(message.data);
      console.log(data); // Log the parsed message data to the console
    
      const newData = {
        icon: data.icon ?? "https://pbs.twimg.com/profile_images/1541289166159622144/gaitivAo_400x400.jpg",
        title: data.title ?? "",
        body: data.body ? trimQuote(data.body) : "",
        image: data.image ?? "",
        info: data.info ?? {},
        suggestions: data.suggestions ?? {},
        _id: data._id,
        time: data.time
      }
    
      console.log(newData)
    
      setMessages(prevMessages => [...prevMessages, newData]);
    };    

    webSocket.current.onclose = (event) => {
      console.log(`WebSocket closed due to ${event.code}. Reconnecting...`);
      reconnectTimeout.current = setTimeout(connect, 1000);
    };

    webSocket.current.onerror = (error) => {
      console.log('WebSocket error: ', error);
      webSocket.current.close();
    };
  };

  useEffect(() => {
    connect();

    return () => {

      if (webSocket.current) {
        webSocket.current.close();
      }

      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }

    };
  }, []);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const checkScroll = () => {
    const container = containerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setIsAtBottom(scrollHeight - scrollTop === clientHeight);
  };

  useEffect(() => {
    const container = containerRef.current;
    container.addEventListener('scroll', checkScroll);

    return () => {
      container.removeEventListener('scroll', checkScroll);
    }
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  return(
    <div className='application-body' ref={containerRef}>

      {messages.map((message) => (

        <div key={message._id} className='news-box'>

          <div className='news-icon'>
            <img src={message.icon} />
          </div>

          <div className='news-container'>
            {
              message.body ? (
                <h1 className='news-title'><span className="bold">{message.title}:</span> <span className='news-body'>{message.body}</span> </h1>
              ) : (
                <h1 className='news-title'>{message.title}</h1>
              )
            }
            {
              message.info?.isQuote ? (
                <div className='news-quote-box'>

                <div className='news-quote-name-container'>
                  <div className='news-quote-icon'>
                    <img src={message.info.quotedUser.icon} />
                  </div>
                  <h1 className='news-quote-name'>{message.info.quotedUser.name} @{message.info.quotedUser.screen_name}</h1>
                </div>

                <h1 className='news-quote-content'>{message.info.quotedUser.text}</h1>

                </div>
              ) : null
            }
          </div>
        </div>

      ))}

      <div ref={messagesEndRef} />

    </div>
  );
};

export default App;
