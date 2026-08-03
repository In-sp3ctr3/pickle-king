"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { SKILL_LEVELS, type SkillLevel } from "@/src/tournament";

export function RatingSelect({
  describedBy,
  id,
  invalid,
  onChange,
  value,
}: {
  describedBy?: string;
  id: string;
  invalid: boolean;
  onChange: (value: SkillLevel) => void;
  value: SkillLevel | "";
}) {
  return (
    <Select.Root onValueChange={onChange} value={value}>
      <Select.Trigger
        aria-describedby={describedBy}
        aria-invalid={invalid}
        aria-label="Rating"
        className="rating-select-trigger"
        data-qa="rating-select"
        id={id}
      >
        <Select.Value placeholder="Choose level" />
        <Select.Icon>
          <ChevronDown aria-hidden="true" size={18} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="rating-select-content"
          collisionPadding={12}
          position="popper"
          sideOffset={8}
        >
          <Select.ScrollUpButton className="rating-select-scroll">
            <ChevronUp aria-hidden="true" size={17} />
          </Select.ScrollUpButton>
          <Select.Viewport className="rating-select-viewport">
            <p className="rating-select-heading">Self-rating</p>
            {SKILL_LEVELS.map((level) => (
              <Select.Item
                aria-label={level}
                className="rating-select-item"
                key={level}
                value={level}
              >
                <Select.ItemText>{level}</Select.ItemText>
                <Select.ItemIndicator className="rating-select-check">
                  <Check aria-hidden="true" size={17} strokeWidth={2.7} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="rating-select-scroll">
            <ChevronDown aria-hidden="true" size={17} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
