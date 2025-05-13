"use client";

import { Button } from "@/components/ui/button";
import WidthWrapper from "../WidthWrapper";
import { motion } from "framer-motion";
import LoomEmbed from "@/lib/heroVideo";
import { ArrowRightIcon } from "lucide-react";

// function PhoneMock() {
//   const { scrollYProgress } = useScroll();
//   const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
//   const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

//   return (
//     <motion.div
//       style={{ y, opacity }}
//       className="w-[260px] md:w-[320px] aspect-[9/19] rounded-[32px] bg-black/90 shadow-2xl overflow-hidden ring-1 ring-white/10 relative group"
//     >
//       <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
//       <video autoPlay loop muted playsInline className="w-full h-full object-cover">
//         <source src="/hero-loop.mp4" type="video/mp4" />
//       </video>
//     </motion.div>
//   );
// }

const Hero = () => {
  return (
    <WidthWrapper className="flex flex-col gap-6 items-center justify-center pt-20 h-screen z-20 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center relative"
      >
        <motion.h1
          className="text-7xl font-bold tracking-tight mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="relative">
            <span className="absolute -inset-1 bg-gradient-to-r from-white/20 via-white/10 to-white/20 blur-xl" />
            <span className="relative">
              A new era of{" "}
              <span className="dark:bg-white text-black bg-yellow-400/70 dark:text-black px-4 py-1">
                digital agreements
              </span>
              .
            </span>
          </span>
        </motion.h1>
        <motion.p
          className="text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Smart, dynamic, and personalized.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="flex gap-4 mt-8"
      >
        <Button
          size="lg"
          className="h-14 px-8 z-50 text-lg bg-white text-black border hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-white/20"
          onClick={() =>
            document
              .getElementById("demo")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Watch 60‑sec prototype
        </Button>
        <Button
          size="lg"
          className="h-14 px-8 z-50 w-48 text-lg bg-black text-white hover:text-black border-2 border-white hover:bg-yellow-400/70 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-white/20"
          onClick={() =>
            document
              .getElementById("cta")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Join Waitlist <ArrowRightIcon />
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex items-center gap-2 bg-gray-700/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
          <span className="text-sm text-black">Prototype built in 6 weeks</span>
        </div>
      </motion.div>

      {/* Hidden Loom modal */}
      <LoomEmbed id="your-loom-id" />
    </WidthWrapper>
  );
};

export default Hero;
