
import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/shared/ai-service';
import { getLoggedInUser } from '@/lib/server/appwrite';

export async function POST(request: NextRequest) {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, target, estimatedTime } = await request.json();

    if (!topic || !target) {
      return NextResponse.json({ error: 'Topic and target are required' }, { status: 400 });
    }

    const aiService = AIService.getInstance();

    const slides = await aiService.generateStudySlide({
      topic,
      target,
      userData: user.prefs.data,
      estimatedTime,
    });

    const script = slides.slides
      .map(slide => 
        slide.elements
          .map(element => element.content)
          .join(' ')
      )
      .join('\n\n');

    return NextResponse.json({ script });
  } catch (error) {
    console.error('Error generating script:', error);
    return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 });
  }
}
