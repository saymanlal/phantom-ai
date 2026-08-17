import { NextResponse } from 'next/server';

// Server-side persistent storage across all devices
// Stores missions, projects, artifacts, and chat events in memory/cache with JSON serialization
const globalState: {
  missions: Record<string, unknown>;
  artifacts: Record<string, unknown>;
  projects: Record<string, unknown>;
  events: unknown[];
} = {
  missions: {},
  artifacts: {},
  projects: {},
  events: [],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';

  if (type === 'artifacts') {
    return NextResponse.json({ artifacts: Object.values(globalState.artifacts) });
  }
  if (type === 'missions') {
    return NextResponse.json({ missions: Object.values(globalState.missions) });
  }
  if (type === 'projects') {
    return NextResponse.json({ projects: Object.values(globalState.projects) });
  }

  return NextResponse.json({
    missions: Object.values(globalState.missions),
    artifacts: Object.values(globalState.artifacts),
    projects: Object.values(globalState.projects),
    events: globalState.events,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'artifact' && data?.hash) {
      globalState.artifacts[data.hash] = data;
    } else if (type === 'mission' && data?.id) {
      globalState.missions[data.id] = data;
    } else if (type === 'project' && data?.id) {
      globalState.projects[data.id] = data;
    } else if (type === 'event' && data) {
      globalState.events.push(data);
    }

    return NextResponse.json({ success: true, count: Object.keys(globalState.artifacts).length });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 400 });
  }
}
