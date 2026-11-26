import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { StepGoalArchetype } from '../StepGoalArchetype';
import type { BaseEngineItem, FeatureItem, GoalArchetype } from '@/data/resume';

const { goals, engines, features } = questionnaireDefaults as {
  goals: GoalArchetype[];
  engines: BaseEngineItem[];
  features: FeatureItem[];
};

describe('StepGoalArchetype Component', () => {
  it('renders Paid Discovery Wedge without raw emojis and collapses all-archetypes list initially', () => {
    render(
      <StepGoalArchetype
        goals={goals}
        engines={engines}
        features={features}
        formData={{
          projectGoal: goals[0].label,
          companyName: '',
          targetAudience: '',
          contactEmail: '',
          contactPhone: '',
          projectStartType: 'greenfield',
        }}
        selectedGoalCategory="all"
        setSelectedGoalCategory={vi.fn()}
        currency="INR"
        user={null}
        onGoalChange={vi.fn()}
        onScopeStartTypeChange={vi.fn()}
        onResetServiceType={vi.fn()}
        onChangeField={vi.fn()}
      />
    );

    // No raw brain emoji in Paid Discovery Wedge heading
    const wedgeTitle = screen.getByRole('heading', { name: /AI Strategy & Solutioning Audit/i });
    expect(wedgeTitle.textContent).not.toContain('🧠');

    // Initial 'all' view caps visible cards at 6 with expand toggle
    const initialRadios = screen.getByRole('radiogroup', { name: /Primary Project Archetype/i })
      .querySelectorAll('[role="radio"]');
    expect(initialRadios.length).toBe(6);

    const expandBtn = screen.getByRole('button', { name: /Show all \d+ archetypes/i });
    fireEvent.click(expandBtn);

    const expandedRadios = screen.getByRole('radiogroup', { name: /Primary Project Archetype/i })
      .querySelectorAll('[role="radio"]');
    expect(expandedRadios.length).toBe(goals.length);

    const collapseBtn = screen.getByRole('button', { name: /Show top 6 archetypes/i });
    fireEvent.click(collapseBtn);

    const recollapsedRadios = screen.getByRole('radiogroup', { name: /Primary Project Archetype/i })
      .querySelectorAll('[role="radio"]');
    expect(recollapsedRadios.length).toBe(6);

    // Arrow key wrapping on category tabs and archetype radio cards
    const tabs = screen.getAllByRole('tab');
    (tabs[tabs.length - 1] as HTMLElement).focus();
    fireEvent.keyDown(tabs[tabs.length - 1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(tabs[0]);

    const firstCard = recollapsedRadios[0] as HTMLElement;
    const lastCard = recollapsedRadios[recollapsedRadios.length - 1] as HTMLElement;
    firstCard.focus();
    fireEvent.keyDown(firstCard, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(lastCard);
  });
});
