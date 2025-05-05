flowchart LR
 subgraph StateManagement["State Management"]
        ZustandStore["Zustand Store<br>(Contract &amp; UI State)"]
  end
 subgraph VoiceComponents["Voice UI Components"]
        TextAnimation["TextAnimation.tsx<br>(Animated Voice UI)"]
        Message["Message.tsx<br>(Conversation Messages)"]
        TypingEffect["useTypingEffect.ts<br>(Text Animation Hook)"]
  end
 subgraph Frontend["Frontend (Next.js)"]
        UI_Main["Subscribe"]
        UI_Editor["Document Template Editor<br>(PDF/Doc Editor)"]
        UI_Signer["Signer Portal UI<br>(Signing Experience)"]
        UI_Chatbot["Voice/Chatbot Interface<br>(Real-time AI Voice)"]
        StateManagement
        VoiceComponents
        ConversationPage["app/c/[slug]/page.tsx<br>(Conversation Manager)"]
  end
 subgraph APIRoutes["API Routes"]
        VoiceRoute["app/api/i/route.ts<br>(ElevenLabs Auth)"]
        ConversationRoute["app/api/c/route.ts<br>(Conversation History)"]
        DocumentRoute["app/api/documents/route.ts<br>(Document Analysis)"]
        ContractRoute["app/api/contracts/route.ts<br>(Contract Management)"]
  end
 subgraph BackendAPI["Backend API"]
        API_Server["REST API Server<br>(Next.js API Routes / Express)"]
        APIRoutes
  end
 subgraph ClerkAuth["Authentication (Clerk)"]
        ClerkClient["Clerk SDK"]
        ClerkUI["Pre-built Auth UI"]
  end
 subgraph Tables["Database Tables"]
        UsersTable["users"]
        ContractsTable["contracts"]
        MessagesTable["messages"]
        DocumentsTable["documents"]
  end
 subgraph Buckets["Storage Buckets"]
        PDFBucket["pdf_documents"]
        AudioBucket["voice_recordings"]
  end
 subgraph SupabaseServices["Database &amp; Storage (Supabase)"]
        Tables
        Buckets
  end
 subgraph AIServices["AI Services"]
        GPT["NLP Engine<br>(OpenAI GPT-4)"]
        VoiceAI["ElevenLabs API<br>(Speech-to-Text &amp; TTS)"]
        ConvAI["ElevenLabs ConvAI<br>(Conversation Agent)"]
        DocAnalysis["Document Analysis<br>(Context Provider)"]
        GeminiAI["Google Generative AI<br>(Contract Analysis)"]
  end
 subgraph ThirdParty["Third Party Services"]
        SignAPI["Digital Signing API<br>(eSignature Provider)"]
        ElevenLabs["ElevenLabs Voice Service"]
        StripeAPI["Stripe API<br>(Payments)"]
  end
 subgraph IntegrationPoint["INTEGRATION POINT"]
        ContextMerger["Document Context + Voice Context<br>(Enhanced Conversation)"]
        PDFProcessor["PDF Processor<br>(Text Extraction &amp; Navigation)"]
        DocumentEditor["Interactive Document Editor<br>(Voice-Controlled)"]
  end
    UI_Editor == Save/Load Templates ==> API_Server
    UI_Signer == Submit Form Data ==> API_Server
    UI_Chatbot ==> ConversationPage
    ConversationPage ==> VoiceComponents
    ClerkUI == Authenticate ==> ClerkClient
    ClerkClient == JWT ==> API_Server
    ConversationPage == useConversation hook ==> VoiceRoute
    ConversationPage == Save/Load Messages ==> ConversationRoute
    UI_Editor == Upload/Analyze ==> DocumentRoute
    UI_Signer == Contract Management ==> ContractRoute
    API_Server == User Data ==> ClerkClient
    ConversationRoute == Store Messages ==> MessagesTable
    DocumentRoute == Store Documents ==> DocumentsTable
    ContractRoute == Store Contracts ==> ContractsTable
    API_Server == Document Analysis ==> DocAnalysis
    API_Server == Contract Analysis ==> GeminiAI
    API_Server == Chat Completions ==> GPT
    VoiceRoute == Get Signed URL ==> VoiceAI
    VoiceAI -- Voice Processing --> ElevenLabs
    ConversationPage == 11labs/react ==> ConvAI
    DocumentRoute -- Document Context --> DocAnalysis
    DocAnalysis ==> ContextMerger
    ConvAI ==> ContextMerger
    ContextMerger == Enhanced Context ==> DocumentEditor
    PDFProcessor -- Text & Structure --> ContextMerger
    ContextMerger == Enhanced Conversation ==> ConversationPage
    UI_Editor == Upload PDF ==> PDFBucket
    UI_Chatbot == Voice Recordings ==> AudioBucket
    PDFBucket == Document Data ==> PDFProcessor
    API_Server == Signature Request ==> SignAPI
    SignAPI == Signed Document ==> API_Server
    UI_Main -- Payments --> StripeAPI

     ContractRoute:::API_Server
     ClerkClient:::authHighlight
     ClerkUI:::authHighlight
     VoiceAI:::API_Server
     ContextMerger:::highlight
     PDFProcessor:::highlight
     DocumentEditor:::highlight
    classDef highlight fill:#f96,stroke:#333,stroke-width:2px
    classDef authHighlight fill:#5cdaed,stroke:#333,stroke-width:2px
    classDef API_Server fill:#5cdaed,stroke:#333,stroke-width:2px
    style ZustandStore fill:#D50000,color:#FFFFFF
    style TextAnimation fill:#2962FF,color:#FFFFFF
    style Message fill:#2962FF,color:#FFFFFF
    style TypingEffect fill:#2962FF,color:#FFFFFF
    style UI_Main fill:#2962FF,color:#FFFFFF
    style UI_Editor fill:#2962FF,color:#FFFFFF
    style UI_Signer fill:#2962FF,color:#FFFFFF
    style UI_Chatbot fill:#2962FF,color:#FFFFFF
    style ConversationPage fill:#2962FF,color:#FFFFFF
    style VoiceRoute fill:#AA00FF,color:#FFFFFF
    style ConversationRoute fill:#AA00FF,color:#FFFFFF
    style DocumentRoute fill:#AA00FF,color:#FFFFFF
    style ContractRoute fill:#AA00FF,color:#FFFFFF
    style API_Server fill:#AA00FF,color:#FFFFFF
    style UsersTable fill:#00C853
    style ContractsTable fill:#00C853
    style MessagesTable fill:#00C853
    style DocumentsTable fill:#00C853
    style PDFBucket fill:#00C853
    style AudioBucket fill:#00C853
    style GPT fill:#FFD600
    style VoiceAI fill:#FFD600
    style ConvAI fill:#FFD600
    style DocAnalysis fill:#FFD600
    style GeminiAI fill:#FFD600
    style SignAPI fill:#FFFFFF,color:#000000
    style SupabaseServices stroke:none
    linkStyle 0 stroke:#AA00FF,fill:none
    linkStyle 1 stroke:#AA00FF,fill:none
    linkStyle 2 stroke:#2962FF,fill:none
    linkStyle 3 stroke:#2962FF,fill:none
    linkStyle 4 stroke:#BBDEFB,fill:none
    linkStyle 5 stroke:#BBDEFB,fill:none
    linkStyle 6 stroke:#AA00FF,fill:none
    linkStyle 7 stroke:#AA00FF,fill:none
    linkStyle 8 stroke:#00C853,fill:none
    linkStyle 9 stroke:#AA00FF,fill:none
    linkStyle 10 stroke:#FFD600,fill:none
    linkStyle 11 stroke:#00C853,fill:none
    linkStyle 12 stroke:#00C853,fill:none
    linkStyle 13 stroke:#00C853,fill:none
    linkStyle 14 stroke:#FFD600,fill:none
    linkStyle 15 stroke:#FFD600,fill:none
    linkStyle 16 stroke:#FFD600,fill:none
    linkStyle 17 stroke:#FFD600,fill:none
    linkStyle 19 stroke:#AA00FF,fill:none
    linkStyle 21 stroke:#FFD600,fill:none
    linkStyle 22 stroke:#FFD600,fill:none
    linkStyle 23 stroke:#FF6D00,fill:none
    linkStyle 25 stroke:#FF6D00,fill:none
    linkStyle 26 stroke:#00C853,fill:none
    linkStyle 27 stroke:#00C853,fill:none
    linkStyle 28 stroke:#00C853,fill:none
    linkStyle 29 stroke:#000000
    linkStyle 30 stroke:#000000,fill:none


