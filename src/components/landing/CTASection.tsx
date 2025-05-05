'use client';

import { Button } from "../ui/button";
import WidthWrapper from "../WidthWrapper";
import { Input } from "../ui/input";
import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="py-32 bg-black relative overflow-hidden">
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
          className="text-center relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-3xl" />
          <h2 className="text-4xl font-bold mb-6 relative">
            <span className="text-gray-300">Be an</span>{" "}
            <span className="bg-white text-black px-4 py-1 rounded-lg">Early Signer</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Join the beta and shape the future of contracts.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-14 px-8 text-lg bg-white text-black hover:bg-gray-200 flex items-center gap-2"
              onClick={() => window.open("https://calendly.com/trustink/demo", "_blank")}
            >
              📅 Book a Demo Call
            </Button>
            <Button
              size="lg"
              className="h-14 px-8 text-lg bg-black text-white border-2 border-white hover:bg-white/10 flex items-center gap-2"
              onClick={() => window.open("https://app.trustink.ai/sandbox", "_blank")}
            >
              📩 Get Beta Access
            </Button>
          </div>

          <p className="mt-8 text-sm text-gray-300">
            Backed by angels from DocuSign & OpenAI
          </p>
        </motion.div>
      </WidthWrapper>
    </section>
  );
};

export default CTASection; 