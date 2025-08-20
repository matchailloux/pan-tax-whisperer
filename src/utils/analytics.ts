// Analytics and tracking utilities

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private userId?: string;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  track(eventName: string, properties: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        userId: this.userId,
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    this.events.push(event);

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsService(event);
    } else {
      console.log('Analytics Event:', event);
    }
  }

  private async sendToAnalyticsService(event: AnalyticsEvent): Promise<void> {
    try {
      // Replace with actual analytics service endpoint
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  page(pageName: string, properties: Record<string, any> = {}): void {
    this.track('page_view', {
      page: pageName,
      ...properties
    });
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

export const analytics = new Analytics();

// Common tracking functions
export const trackButtonClick = (buttonName: string, location: string) => {
  analytics.track('button_click', { buttonName, location });
};

export const trackFormSubmit = (formName: string, success: boolean) => {
  analytics.track('form_submit', { formName, success });
};

export const trackFileUpload = (fileName: string, fileSize: number, success: boolean) => {
  analytics.track('file_upload', { fileName, fileSize, success });
};

export const trackError = (error: string, context: string) => {
  analytics.track('error', { error, context });
};