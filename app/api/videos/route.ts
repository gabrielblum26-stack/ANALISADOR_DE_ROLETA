import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const videosDir = path.join(process.cwd(), 'public', 'videos');
    
    // Verifica se a pasta existe
    if (!fs.existsSync(videosDir)) {
      return NextResponse.json({ videos: [] });
    }

    // Lista todos os arquivos na pasta
    const files = fs.readdirSync(videosDir);
    
    // Filtra apenas vídeos (extensões comuns)
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
    const videos = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return videoExtensions.includes(ext);
      })
      .map(file => ({
        title: path.parse(file).name, // Nome do arquivo sem extensão
        filename: file,
        url: `/videos/${file}`,
        extension: path.extname(file).toLowerCase()
      }))
      .sort((a, b) => a.title.localeCompare(b.title)); // Ordena alfabeticamente

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Erro ao listar vídeos:', error);
    return NextResponse.json({ videos: [], error: 'Erro ao listar vídeos' }, { status: 500 });
  }
}
