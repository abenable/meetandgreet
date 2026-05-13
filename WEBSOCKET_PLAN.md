# WebSocket Implementation Plan

## Analysis: Areas for WebSocket Improvement

### Current Architecture Issues
The app currently uses **polling via React Query** for real-time features:
- Chat messages: `useQuery` with manual invalidation
- Match notifications: Polling for new matches
- Swipe updates: No real-time feedback
- Conversation list: Manual refresh needed

### Performance Problems
1. **High latency**: 1-5 second delays for message delivery
2. **Unnecessary load**: Constant polling even when idle
3. **Battery drain**: Mobile devices constantly polling
4. **Stale data**: Users see outdated information between polls
5. **Poor UX**: No instant feedback for actions

---

## WebSocket Benefits

### Real-Time Features That Need WebSockets
1. **Chat Messages** (HIGH PRIORITY)
   - Instant message delivery
   - Typing indicators
   - Read receipts in real-time
   - Online/offline status

2. **Match Notifications** (HIGH PRIORITY)
   - Instant match alerts
   - New match requests
   - Request acceptance notifications

3. **Swipe Feedback** (MEDIUM PRIORITY)
   - Real-time "You matched!" notifications
   - Mutual like indicators

4. **Event Updates** (MEDIUM PRIORITY)
   - New attendees joining
   - Event status changes
   - Organizer announcements

---

## Implementation Strategy

### Technology Stack
- **Server**: Native Node.js `ws` library (already in dependencies)
- **Client**: Native WebSocket API with React hooks
- **Protocol**: JSON-based message format
- **Auth**: Session token validation on connection

### Architecture Design

#### 1. WebSocket Server (`src/server/websocket.ts`)
```typescript
interface WSMessage {
  type: 'chat_message' | 'match_created' | 'typing' | 'read_receipt' | 'online_status'
  payload: any
  timestamp: number
}

interface ConnectedClient {
  userId: string
  ws: WebSocket
  eventIds: Set<string>  // Events user is subscribed to
}
```

#### 2. Client Hook (`src/hooks/useWebSocket.ts`)
```typescript
export function useWebSocket() {
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)
  
  // Auto-reconnect logic
  // Message queue for offline messages
  // Event subscription management
}
```

#### 3. Integration Points
- **Chat**: Replace polling with WebSocket messages
- **Matches**: Subscribe to match events
- **Notifications**: Real-time notification delivery

---

## Implementation Steps

### Phase 1: Core Infrastructure
1. Create WebSocket server with authentication
2. Implement connection management (connect, disconnect, reconnect)
3. Create client-side WebSocket hook
4. Add message routing and event subscriptions

### Phase 2: Chat Integration
1. Replace chat polling with WebSocket messages
2. Add typing indicators
3. Implement real-time read receipts
4. Add online/offline status

### Phase 3: Match Integration
1. Real-time match notifications
2. Instant match request alerts
3. Live swipe feedback

### Phase 4: Testing & Optimization
1. Test reconnection logic
2. Verify message delivery
3. Load testing with multiple connections
4. Mobile testing for battery impact

---

## Message Protocol

### Client → Server
```json
{
  "type": "subscribe_event",
  "eventId": "event-123"
}

{
  "type": "send_message",
  "chatId": "chat-456",
  "content": "Hello!"
}

{
  "type": "typing",
  "chatId": "chat-456",
  "isTyping": true
}
```

### Server → Client
```json
{
  "type": "chat_message",
  "payload": {
    "chatId": "chat-456",
    "message": { ... }
  },
  "timestamp": 1234567890
}

{
  "type": "match_created",
  "payload": {
    "matchId": "match-789",
    "peerId": "user-123"
  },
  "timestamp": 1234567890
}
```

---

## Fallback Strategy
- Keep React Query as fallback for WebSocket failures
- Graceful degradation to polling if WebSocket unavailable
- Message queue for offline scenarios
- Auto-reconnect with exponential backoff

---

## Security Considerations
1. Validate session token on WebSocket connection
2. Rate limiting for message sending
3. Event subscription authorization (only subscribed events)
4. Input sanitization for all messages
5. Connection timeout for idle clients

---

## Performance Targets
- **Connection time**: < 500ms
- **Message latency**: < 100ms
- **Reconnection time**: < 2s
- **Memory per connection**: < 1MB
- **Max concurrent connections**: 10,000+
