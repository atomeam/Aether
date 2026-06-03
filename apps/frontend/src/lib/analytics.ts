// Product Analytics Tracking for a-to-mind.com

interface AnalyticsEvent {
  event_name: string;
  event_category: string;
  event_label?: string;
  value?: number;
  user_id?: string;
  session_id?: string;
  timestamp: number;
  page: string;
  referrer?: string;
  user_agent?: string;
}

class ProductAnalytics {
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = localStorage.getItem('aether_user_id');
    if (!this.userId) {
      this.userId = this.generateUserId();
      localStorage.setItem('aether_user_id', this.userId);
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track page views
  trackPageView(page: string, title?: string) {
    this.sendEvent({
      event_name: 'page_view',
      event_category: 'navigation',
      event_label: page,
      page,
      timestamp: Date.now(),
      referrer: document.referrer,
      user_agent: navigator.userAgent
    });

    // Also send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_title: title || page,
        page_location: window.location.href
      });
    }
  }

  // Track feature usage
  trackFeatureUsage(feature: string, action: string, metadata?: Record<string, any>) {
    this.sendEvent({
      event_name: 'feature_usage',
      event_category: 'feature',
      event_label: `${feature}_${action}`,
      page: window.location.pathname,
      timestamp: Date.now()
    });

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'feature_usage', {
        feature_name: feature,
        action: action,
        ...metadata
      });
    }
  }

  // Track user funnel events
  trackFunnel(step: string, funnel: string) {
    this.sendEvent({
      event_name: 'funnel_step',
      event_category: 'funnel',
      event_label: `${funnel}_${step}`,
      page: window.location.pathname,
      timestamp: Date.now()
    });

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'funnel_step', {
        funnel_name: funnel,
        step_name: step
      });
    }
  }

  // Track engagement
  trackEngagement(type: string, duration?: number) {
    this.sendEvent({
      event_name: 'engagement',
      event_category: 'engagement',
      event_label: type,
      value: duration,
      page: window.location.pathname,
      timestamp: Date.now()
    });

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'engagement', {
        engagement_type: type,
        engagement_duration: duration
      });
    }
  }

  // Track errors
  trackError(error: string, context?: Record<string, any>) {
    this.sendEvent({
      event_name: 'error',
      event_category: 'error',
      event_label: error,
      page: window.location.pathname,
      timestamp: Date.now()
    });

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'error', {
        error_message: error,
        ...context
      });
    }
  }

  // Track conversion
  trackConversion(conversionType: string, value?: number) {
    this.sendEvent({
      event_name: 'conversion',
      event_category: 'conversion',
      event_label: conversionType,
      value,
      page: window.location.pathname,
      timestamp: Date.now()
    });

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        conversion_type: conversionType,
        value: value
      });
    }
  }

  // Track retention
  trackRetention(daysSinceSignup: number) {
    this.sendEvent({
      event_name: 'retention',
      event_category: 'retention',
      event_label: `day_${daysSinceSignup}`,
      page: window.location.pathname,
      timestamp: Date.now()
    });

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'retention', {
        days_since_signup: daysSinceSignup
      });
    }
  }

  // Track A/B test
  trackABTest(testName: string, variant: string) {
    this.sendEvent({
      event_name: 'ab_test',
      event_category: 'experiment',
      event_label: `${testName}_${variant}`,
      page: window.location.pathname,
      timestamp: Date.now()
    });

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'ab_test', {
        test_name: testName,
        variant: variant
      });
    }
  }

  // Send event to backend
  private async sendEvent(event: AnalyticsEvent) {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...event,
          user_id: this.userId,
          session_id: this.sessionId
        })
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  // Track time on page
  startTimeOnPage() {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.trackEngagement('time_on_page', duration);
    };
  }

  // Track scroll depth
  trackScrollDepth(depth: number) {
    this.trackEngagement('scroll_depth', depth);
  }

  // Track click
  trackClick(element: string, context?: string) {
    this.trackFeatureUsage('click', element, { context });
  }

  // Track form submission
  trackFormSubmit(formName: string, success: boolean) {
    this.trackFeatureUsage('form_submit', formName, { success });
  }

  // Track search
  trackSearch(query: string, resultsCount: number) {
    this.trackFeatureUsage('search', 'query', { 
      query_length: query.length,
      results_count: resultsCount 
    });
  }

  // Track download
  trackDownload(fileName: string, fileType: string) {
    this.trackFeatureUsage('download', fileType, { file_name: fileName });
  }

  // Track share
  trackShare(platform: string, content: string) {
    this.trackFeatureUsage('share', platform, { content });
  }

  // Track feedback
  trackFeedback(rating: number, comment?: string) {
    this.trackFeatureUsage('feedback', 'rating', { 
      rating,
      has_comment: !!comment 
    });
  }
}

// Export singleton instance
export const analytics = new ProductAnalytics();

// Auto-track page views
if (typeof window !== 'undefined') {
  // Track initial page view
  analytics.trackPageView(window.location.pathname, document.title);

  // Track page changes (SPA navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    analytics.trackPageView(window.location.pathname, document.title);
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    analytics.trackPageView(window.location.pathname, document.title);
  };

  // Track time on page when user leaves
  const endTimeOnPage = analytics.startTimeOnPage();
  window.addEventListener('beforeunload', endTimeOnPage);

  // Track scroll depth
  let maxScrollDepth = 0;
  window.addEventListener('scroll', () => {
    const scrollDepth = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    if (scrollDepth > maxScrollDepth && scrollDepth % 25 === 0) {
      maxScrollDepth = scrollDepth;
      analytics.trackScrollDepth(scrollDepth);
    }
  });
}