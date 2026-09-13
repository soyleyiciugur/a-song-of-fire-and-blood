import worldDate from "@/data/worldDate.json";
import { getCalendarEvents } from "@/data/calendar";
import { CALENDAR_TYPES } from "@/lib/calendar";
import RealmCalendar from "@/components/calendar/RealmCalendar";

export default function WorldDateCard() {
  const events = getCalendarEvents().filter(event => CALENDAR_TYPES.some(type => type === event.type));
  return <RealmCalendar today={worldDate} events={events} compact />;
}
