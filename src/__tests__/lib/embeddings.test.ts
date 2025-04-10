import { generateEmbedding, storeEmbeddings, searchSimilarSections } from '@/lib/embeddings';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai', () => {
  const mockOpenAI = jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })
    }
  }));
  return { default: mockOpenAI };
});

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
    rpc: jest.fn().mockResolvedValue({
      data: [
        {
          section_id: 'test-section',
          content: 'Test content',
          metadata: {},
          similarity: 0.95
        }
      ],
      error: null
    })
  }))
}));

describe('Embeddings Functionality', () => {
  const mockSupabase = createClient<Database>(
    'http://localhost',
    'test-key'
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('generates embeddings for text input', async () => {
      const text = 'Test text for embedding';
      const embedding = await generateEmbedding(text);

      expect(embedding).toHaveLength(1536);
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: process.env.OPENAI_API_KEY });
    });

    it('handles errors during embedding generation', async () => {
      const mockError = new Error('API error');
      const mockOpenAI = jest.fn().mockImplementation(() => ({
        embeddings: {
          create: jest.fn().mockRejectedValue(mockError)
        }
      }));
      (OpenAI as unknown as jest.Mock).mockImplementationOnce(mockOpenAI);

      await expect(generateEmbedding('test')).rejects.toThrow('Failed to generate embedding');
    });
  });

  describe('storeEmbeddings', () => {
    const mockSections = [
      {
        id: 'section-1',
        content: 'Test content 1',
        metadata: { page: 1 }
      },
      {
        id: 'section-2',
        content: 'Test content 2',
        metadata: { page: 2 }
      }
    ];

    it('stores embeddings for document sections', async () => {
      await storeEmbeddings(mockSupabase, 'doc-123', mockSections);

      expect(mockSupabase.from).toHaveBeenCalledWith('document_embeddings');
      expect(mockSupabase.from('').insert).toHaveBeenCalled();
    });

    it('handles database errors', async () => {
      const mockError = new Error('Database error');
      (mockSupabase.from('').insert as jest.Mock).mockResolvedValueOnce({ error: mockError });

      await expect(storeEmbeddings(mockSupabase, 'doc-123', mockSections))
        .rejects.toThrow('Failed to store embeddings');
    });
  });

  describe('searchSimilarSections', () => {
    it('searches for similar sections', async () => {
      const results = await searchSimilarSections(mockSupabase, 'test query');

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('sectionId', 'test-section');
      expect(results[0]).toHaveProperty('similarity', 0.95);
    });

    it('returns empty array when no matches found', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null });

      const results = await searchSimilarSections(mockSupabase, 'no matches');

      expect(results).toHaveLength(0);
    });

    it('handles search errors', async () => {
      const mockError = new Error('Search error');
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce({ error: mockError });

      await expect(searchSimilarSections(mockSupabase, 'test'))
        .rejects.toThrow('Failed to search similar sections');
    });

    it('uses custom match threshold and count', async () => {
      await searchSimilarSections(mockSupabase, 'test query', {
        matchThreshold: 0.9,
        matchCount: 5
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('match_document_sections', {
        query_embedding: expect.any(Array),
        match_threshold: 0.9,
        match_count: 5
      });
    });
  });
}); 