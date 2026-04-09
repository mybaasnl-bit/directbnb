'use client';

import { FeedbackButton } from './feedback-button';
import { MessageSquarePlus } from 'lucide-react';

interface BetaBannerProps {
  title?: string;
  description?: string;
}

export function BetaBanner({
  title = 'Beta feedback',
  description = 'Help ons DirectBnB te verbeteren. Deel je gedachten, meld bugs of stel nieuwe features voor.',
}: BetaBannerProps) {
  return (
    <div className="bg-brand-light rounded-2xl p-6 flex items-start gap-4">
      <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
        <MessageSquarePlus className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <h2 className="font-bold text-slate-900 mb-1">{title}</h2>
        <p className="text-slate-500 text-sm mb-4">{description}</p>
        <FeedbackButton />
      </div>
    </div>
  );
}
