/**
 * QUICK START EXAMPLE
 * 
 * Copy this into your results page to start using the Pattern Synthesis Engine
 */

"use client"; // If using Next.js App Router

import { useState } from "react";
import { buildEnhancedSoulScopeReport } from "@/lib/enhancedReporting";
import PremiumResultsDashboard from "@/components/PremiumResultsDashboard";
import { type VoiceAnalysisResult } from "@/lib/voiceSpectrum";

/**
 * Example: ResultsPage Component
 * 
 * This is a minimal example showing how to integrate the Pattern Synthesis Engine.
 * In your actual implementation, adapt this to your routing/data-fetching strategy.
 */

interface ResultsPageProps {
  scan?: VoiceAnalysisResult;
  userId?: string;
  scanId?: string;
}

export default function ResultsPage({ scan, userId, scanId }: ResultsPageProps) {
  // State for story selection preference
  const [selectedStory, setSelectedStory] = useState<"Direct" | "Supportive" | "Insight" | "Grounded/Actionable" | null>(null);

  if (!scan) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-1200px mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold">Results Example</h1>
          <p className="text-gray-600 mt-3">
            This example page expects a <code>scan</code> object. Provide scan data when embedding this component in your app.
          </p>
        </div>
      </main>
    );
  }

  // Build the enhanced report (includes synthesis)
  const { report, synthesis, isAccurate } = buildEnhancedSoulScopeReport(scan);

  // Handle story selection
  const handleSelectStory = async (style: "Direct" | "Supportive" | "Insight" | "Grounded/Actionable") => {
    setSelectedStory(style);

    // Optional: Send preference to backend for learning
    if (userId && scanId) {
      try {
        await fetch("/api/results/story-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            scanId,
            preferredStyle: style,
            pattern: synthesis.primaryPattern.id,
          }),
        });
      } catch (error) {
        console.error("Failed to save story preference:", error);
      }
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Optional: Header/Navigation */}
      <header className="border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="max-w-1200px mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Your SoulScope Results</h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-gray-50 min-h-screen py-8">
        <PremiumResultsDashboard
          report={report}
          synthesis={synthesis}
          onSelectStory={handleSelectStory}
          selectedStoryStyle={selectedStory}
        />
      </div>

      {/* Optional: Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 mt-16">
        <div className="max-w-1200px mx-auto px-4">
          <p className="text-gray-600 text-sm">
            This scan is a moment-in-time reflection of your system. Patterns shift as conditions change.
          </p>
          <p className="text-gray-500 text-xs mt-4">
            SoulScope © 2026. All information is private and secured.
          </p>
        </div>
      </footer>
    </main>
  );
}

/**
 * Example: Server Component with Data Fetching (Next.js 13+)
 * 
 * If you're using Server Components and fetching the scan from a database:
 */

/*
import { notFound } from "next/navigation";

interface PageProps {
  params: { scanId: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function ResultsPageWithData({ params }: PageProps) {
  const { scanId } = params;

  // Fetch the scan data
  const response = await fetch(`${process.env.API_URL}/scans/${scanId}`, {
    headers: {
      Authorization: `Bearer ${process.env.API_KEY}`,
    },
  });

  if (!response.ok) {
    notFound();
  }

  const scan = await response.json();

  return (
    <ResultsPage
      scan={scan}
      scanId={scanId}
      userId={session?.user?.id}
    />
  );
}
*/

/**
 * Example: With Analytics Tracking
 * 
 * Add this to track user engagement:
 */

/*
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

export default function ResultsPageWithAnalytics({ scan, userId, scanId }: ResultsPageProps) {
  const { report, synthesis } = buildEnhancedSoulScopeReport(scan);
  const [selectedStory, setSelectedStory] = useState<"Direct" | "Supportive" | "Insight" | null>(null);

  // Track page view
  useEffect(() => {
    analytics.track("results_page_viewed", {
      userId,
      scanId,
      pattern: synthesis.primaryPattern.id,
      patternName: synthesis.primaryPattern.name,
      confidence: synthesis.confidence,
    });
  }, []);

  // Track story selection
  const handleSelectStory = (style: "Direct" | "Supportive" | "Insight") => {
    setSelectedStory(style);
    
    analytics.track("story_style_selected", {
      userId,
      scanId,
      selectedStyle: style,
      pattern: synthesis.primaryPattern.id,
    });
  };

  // Track scroll depth
  useEffect(() => {
    let lastScrollDepth = 0;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const scrollDepth = scrollHeight > 0 ? Math.round((scrolled / scrollHeight) * 100) : 0;

      // Track in 10% increments
      if (scrollDepth - lastScrollDepth >= 10) {
        analytics.track("results_scroll_depth", {
          userId,
          scanId,
          depth: scrollDepth,
        });
        lastScrollDepth = scrollDepth;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main>
      <PremiumResultsDashboard
        report={report}
        synthesis={synthesis}
        onSelectStory={handleSelectStory}
        selectedStoryStyle={selectedStory}
      />
    </main>
  );
}
*/

/**
 * Example: Error Boundary
 * 
 * Wrap your results page with error handling:
 */

/*
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Results</h1>
        <p className="text-gray-600 mb-8">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default function ResultsPageWithErrorBoundary(props: ResultsPageProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ResultsPage {...props} />
    </ErrorBoundary>
  );
}
*/

/**
 * Example: With Loading State
 * 
 * If you're fetching the scan asynchronously:
 */

/*
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function ResultsLoadingFallback() {
  return (
    <div className="max-w-1200px mx-auto px-4 py-8">
      <Skeleton className="h-96 w-full mb-8" />
      <Skeleton className="h-64 w-full mb-8" />
      <Skeleton className="h-64 w-full mb-8" />
    </div>
  );
}

export default function ResultsPageWithSuspense({ scanId }: { scanId: string }) {
  return (
    <main>
      <Suspense fallback={<ResultsLoadingFallback />}>
        <ResultsPageWithData params={{ scanId }} searchParams={{}} />
      </Suspense>
    </main>
  );
}
*/

/**
 * Example: Minimal Standalone Usage
 * 
 * If you just want to test the synthesis without full page integration:
 */

/*
import { buildEnhancedSoulScopeReport } from "@/lib/enhancedReporting";
import { type VoiceAnalysisResult } from "@/lib/voiceSpectrum";

// Your test scan data
const testScan: VoiceAnalysisResult = {
  // ... your scan data
};

// Generate the report
const { report, synthesis } = buildEnhancedSoulScopeReport(testScan);

// Log the synthesis to see the structure
console.log("Primary Pattern:", synthesis.primaryPattern);
console.log("Primary Drivers:", synthesis.primaryDrivers);
console.log("Likely Experiences:", synthesis.likelyExperiences);
console.log("Protective Factors:", synthesis.protectiveFactors);
console.log("Suggested Focus:", synthesis.suggestedFocus);
console.log("Confidence:", synthesis.confidence);
*/

/**
 * INTEGRATION CHECKLIST
 * 
 * - [ ] Import buildEnhancedSoulScopeReport
 * - [ ] Import PremiumResultsDashboard component
 * - [ ] Create or update your results page
 * - [ ] Pass scan data to buildEnhancedSoulScopeReport()
 * - [ ] Pass report and synthesis to PremiumResultsDashboard
 * - [ ] Wire up onSelectStory handler
 * - [ ] Test with sample scans
 * - [ ] Verify pattern synthesis looks correct
 * - [ ] Check responsive design on mobile
 * - [ ] Add analytics tracking (optional)
 * - [ ] Deploy to staging for user testing
 * - [ ] Collect feedback on pattern accuracy
 * - [ ] Deploy to production
 */
