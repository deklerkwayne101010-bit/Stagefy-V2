# CRM Calendar & Reminder System Enhancement

## Overview
Enhance the existing CRM with a comprehensive calendar and reminder system while maintaining simplicity and ease of use. The system will integrate seamlessly with existing contacts, listings, and tasks.

## Current CRM State
- ✅ Contacts management
- ✅ Listings management
- ✅ Tasks system
- ✅ Activities logging
- ❌ Calendar system
- ❌ Reminder notifications
- ❌ Appointment scheduling

## Enhancement Goals
1. **Simple Calendar Interface** - Month/week/day views with drag-and-drop
2. **Smart Reminders** - Automated notifications for appointments and follow-ups
3. **CRM Integration** - Link appointments to contacts, listings, and tasks
4. **Mobile-Friendly** - Responsive design for on-the-go access
5. **Automation** - Auto-schedule follow-ups and reminders

## Database Schema Design

### New Tables

#### `calendar_events`
```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'appointment', 'meeting', 'viewing', 'call', 'reminder'
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  contact_id UUID REFERENCES crm_contacts(id),
  listing_id UUID REFERENCES crm_listings(id),
  task_id UUID REFERENCES crm_tasks(id),
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'cancelled'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  recurrence_rule TEXT, -- RRULE for recurring events
  reminder_minutes INTEGER DEFAULT 15, -- minutes before event to remind
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `event_reminders`
```sql
CREATE TABLE event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 'email', 'push', 'sms'
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `calendar_settings`
```sql
CREATE TABLE calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  default_view TEXT DEFAULT 'month', -- 'month', 'week', 'day'
  working_hours_start TIME DEFAULT '09:00',
  working_hours_end TIME DEFAULT '17:00',
  timezone TEXT DEFAULT 'Africa/Johannesburg',
  reminder_defaults JSONB DEFAULT '{"email": true, "push": true, "minutes": 15}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## UI/UX Design

### Calendar Views
1. **Month View** - Overview with event dots
2. **Week View** - Detailed weekly schedule
3. **Day View** - Hourly breakdown
4. **Agenda View** - List of upcoming events

### Event Types & Colors
- 🏠 **Property Viewing** (Blue) - Linked to listings
- 👥 **Client Meeting** (Green) - Linked to contacts
- 📞 **Phone Call** (Orange) - Follow-up calls
- 📝 **General Appointment** (Purple) - Other appointments
- 🔔 **Reminder** (Red) - System reminders

### Quick Actions
- **+ New Event** - Quick add from any view
- **Drag & Drop** - Reschedule events easily
- **Quick Edit** - Inline editing
- **Smart Suggestions** - Auto-suggest times based on availability

## Features

### 1. Calendar Integration
- **Contact Integration**: Schedule meetings directly from contact profiles
- **Listing Integration**: Book viewings from property listings
- **Task Integration**: Convert tasks to calendar events
- **Google Calendar Sync**: Optional two-way sync

### 2. Smart Reminders
- **Multiple Channels**: Email, push notifications, SMS
- **Customizable Timing**: 5 min to 1 week before
- **Smart Defaults**: Different reminders for different event types
- **Follow-up Automation**: Auto-create follow-up reminders

### 3. Appointment Management
- **Booking System**: Clients can request appointments
- **Confirmation System**: Email/SMS confirmations
- **Status Tracking**: Scheduled → Confirmed → Completed
- **Recurring Events**: Weekly meetings, monthly reviews

### 4. Mobile Experience
- **Responsive Design**: Works on all devices
- **Quick Add**: Floating action button for new events
- **Voice Commands**: "Schedule meeting with John tomorrow"
- **Offline Support**: View calendar offline

## Implementation Plan

### Phase 1: Core Calendar (Week 1-2)
1. Database schema creation
2. Basic calendar UI (month/week/day views)
3. Event CRUD operations
4. Basic integration with existing CRM

### Phase 2: Reminders & Notifications (Week 3)
1. Reminder system implementation
2. Email notification templates
3. Push notification setup
4. Reminder scheduling logic

### Phase 3: Advanced Features (Week 4)
1. Recurring events
2. Calendar sharing
3. Advanced integrations
4. Mobile optimizations

### Phase 4: Automation & AI (Week 5)
1. Smart scheduling suggestions
2. Auto-follow-up creation
3. Lead nurturing automation
4. Performance analytics

## API Endpoints

### Calendar Events
- `GET /api/calendar/events` - List events with filtering
- `POST /api/calendar/events` - Create new event
- `PUT /api/calendar/events/[id]` - Update event
- `DELETE /api/calendar/events/[id]` - Delete event

### Reminders
- `GET /api/calendar/reminders` - Get pending reminders
- `POST /api/calendar/reminders/send` - Trigger reminder

### Settings
- `GET /api/calendar/settings` - Get user calendar settings
- `PUT /api/calendar/settings` - Update settings

## User Journey Examples

### Scenario 1: Schedule Property Viewing
1. Open property listing
2. Click "Schedule Viewing"
3. Select date/time from calendar
4. Add client contact
5. System auto-creates reminder
6. Client receives confirmation email

### Scenario 2: Follow-up Call
1. Complete a client meeting
2. System auto-schedules follow-up call in 3 days
3. Reminder sent 15 minutes before
4. Call logged as activity

### Scenario 3: Lead Nurturing
1. New contact added
2. System schedules initial contact in 24 hours
3. Follow-up sequence: Day 3, Day 7, Day 14
4. Each touch-point tracked

## Success Metrics
- **Calendar Usage**: Events created per user per month
- **Reminder Effectiveness**: Reminder response rate
- **Lead Conversion**: Appointments → Closed deals
- **User Satisfaction**: Ease of use ratings

## Technical Considerations
- **Performance**: Efficient calendar queries with proper indexing
- **Time Zones**: Proper handling of user timezones
- **Conflicts**: Prevent double-booking
- **Privacy**: Event sharing permissions
- **Scalability**: Handle large numbers of events

## Migration Strategy
1. Deploy calendar tables alongside existing CRM
2. Gradual rollout of features
3. Import existing tasks as calendar events
4. User training and documentation
5. Feedback collection and iteration