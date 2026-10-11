// Presentation only: API responses and database records retain every event.
export function isEventVisible(event) {
  const type = typeof event === 'string' ? event
    : event.eventType || event.Event_type || event.event || event.type || '';
  return !/^(shots?|saves?|passes|pass)(?:$|[\s_-])/i.test(type.trim());
}

export function visibleClips(data) {
  const events = data.events || [];
  const visibleUrls = new Set(events.filter(isEventVisible).map(event =>
    event.clip_url || event.clipFileLocation || event.video_path || event.VideoPath
  ).filter(Boolean));
  const clips = data.clips || [...visibleUrls].map(url => ({ url }));
  // A goal and shot can share a clip. Keep that clip for the visible goal.
  return [...new Map(clips.filter(clip => clip.url && (
    clip.event_types?.some(isEventVisible) || visibleUrls.has(clip.url)
  )).map(clip => [clip.url, clip])).values()];
}
