'use client';

import WidthWrapper from "../WidthWrapper";
import { motion } from "framer-motion";
import { StepForward, Share2, FileSignature } from "lucide-react";

const steps = [
  {
    icon: <StepForward className="w-6 h-6" />,
    gif: '/steps/upload.mp4',
    caption: 'Drag‑drop PDF → sections auto‑detected'
  },
  {
    icon: <StepForward className="w-6 h-6" />,
    gif: '/steps/highlight.mp4',
    caption: 'Voice: "Show one‑sided termination" → AI highlights risky text'
  },
  {
    icon: <StepForward className="w-6 h-6" />,
    gif: '/steps/diff.mp4',
    caption: 'Voice: "Make it mutual & 30‑day notice" → live diff appears'
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    gif: '/steps/share.mp4',
    caption: 'Click "Share with co‑signer" → instant audit‑trailed link'
  },
  {
    icon: <FileSignature className="w-6 h-6" />,
    gif: '/steps/sign.mp4',
    caption: 'Both parties tap Sign → tamper‑proof PDF saved'
  }
];

const DemoSection = () => {
  return (
    <section id="demo" className="py-32 bg-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>
      <WidthWrapper>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-3xl" />
          <h2 className="text-4xl font-bold mb-6 relative">
            <span className="text-gray-300">Prototype</span>{" "}
            <span className="bg-white text-black px-4 py-1 rounded-lg">walk‑through</span>
          </h2>
        </motion.div>

        <div className="flex flex-col md:flex-row md:flex-wrap gap-8 justify-center">
          {steps.map(({ icon, gif, caption }, index) => (
            <motion.div
              key={caption}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="w-[280px] p-6 bg-black/50 backdrop-blur-sm rounded-xl border-2 border-white/20 transform transition-all duration-300 hover:scale-105"
            >
              <video autoPlay loop muted playsInline className="rounded-xl w-full aspect-video mb-4">
                <source src={gif} type="video/mp4"/>
              </video>
              <div className="flex items-center gap-2 text-gray-300">
                {icon}
                <span className="text-sm">{caption}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <a 
            href="/sandbox" 
            className="text-cyan-400 underline-offset-4 hover:underline"
            onClick={(e) => {
              e.preventDefault();
              window.open("https://app.trustink.ai/sandbox", "_blank");
            }}
          >
            Play with the live sandbox →
          </a>
        </motion.div>
      </WidthWrapper>
    </section>
  );
};

export default DemoSection; 