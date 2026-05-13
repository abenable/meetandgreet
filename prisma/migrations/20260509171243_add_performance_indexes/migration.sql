-- CreateIndex
CREATE INDEX "Event_isPublic_isActive_idx" ON "Event"("isPublic", "isActive");

-- CreateIndex
CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");

-- CreateIndex
CREATE INDEX "EventAttendee_userId_idx" ON "EventAttendee"("userId");

-- CreateIndex
CREATE INDEX "EventAttendee_eventId_leftAt_idx" ON "EventAttendee"("eventId", "leftAt");

-- CreateIndex
CREATE INDEX "EventMatch_eventId_user1Id_idx" ON "EventMatch"("eventId", "user1Id");

-- CreateIndex
CREATE INDEX "EventMatch_eventId_user2Id_idx" ON "EventMatch"("eventId", "user2Id");

-- CreateIndex
CREATE INDEX "EventMessage_matchId_createdAt_idx" ON "EventMessage"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "EventMessage_senderId_idx" ON "EventMessage"("senderId");

-- CreateIndex
CREATE INDEX "EventSwipe_eventId_swipedId_direction_idx" ON "EventSwipe"("eventId", "swipedId", "direction");

-- CreateIndex
CREATE INDEX "EventSwipe_swiperId_idx" ON "EventSwipe"("swiperId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
