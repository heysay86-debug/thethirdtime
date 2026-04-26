import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts, getPost } from '@/src/lib/blog';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');

  if (slug) {
    const post = getPost(slug);
    if (!post) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json(post);
  }

  const posts = getAllPosts().map(({ content, ...rest }) => rest);
  return NextResponse.json({ posts });
}
