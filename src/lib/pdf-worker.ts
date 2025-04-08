import { pdfjs } from "react-pdf";

// Explicitly set the worker version to match the main package version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;
