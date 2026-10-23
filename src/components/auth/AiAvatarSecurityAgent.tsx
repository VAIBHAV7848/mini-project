'use client';

import React from 'react';
import { RealisticAiVideoAvatar, VideoAvatarState } from './RealisticAiVideoAvatar';
import { ReactAiAvatarCoder } from './ReactAiAvatarCoder';
import { ReactAiAvatarOrb } from './ReactAiAvatarOrb';

export type SecurityAgentVariant = 'video' | 'coder' | 'orb';

export interface AiAvatarSecurityAgentProps {
  state?: VideoAvatarState;
  variant?: SecurityAgentVariant;
  size?: number;
  className?: string;
  caption?: string;
}

export function AiAvatarSecurityAgent({
  state = 'idle',
  variant = 'video',
  size = 220,
  className = '',
  caption,
}: AiAvatarSecurityAgentProps) {
  if (variant === 'video') {
    return (
      <RealisticAiVideoAvatar
        state={state}
        size={size}
        className={className}
        caption={caption}
      />
    );
  }

  if (variant === 'orb') {
    return (
      <ReactAiAvatarOrb
        state={state}
        size={size}
        className={className}
        caption={caption}
      />
    );
  }

  return (
    <ReactAiAvatarCoder
      state={state}
      size={size}
      className={className}
      caption={caption}
      poses={true}
    />
  );
}
