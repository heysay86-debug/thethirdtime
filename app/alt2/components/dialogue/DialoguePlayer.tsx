'use client';

import { useState, useCallback, useRef } from 'react';
import DialogueBox from '../base/DialogueBox';
import type { DialogueLine } from '../base/DialogueBox';
import ChoicePanel from './ChoicePanel';
import DialogueInput from './DialogueInput';
import type { InputType } from './DialogueInput';
import { hasLeapMonth } from '@engine/calendar';

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

interface SajuInput {
  birthDate: string;
  birthTime: string;
  calendar: 'solar' | 'lunar';
  isLeapMonth: boolean;
  birthCity: string;
  gender: 'M' | 'F' | '';
  name: string;
}

type ZoneBg = 'before' | 'after' | 'blackout' | 'inside_sun' | 'inside_moon' | 'past';

interface DotMoveState {
  direction?: 'front' | 'back' | 'left' | 'right';
  x?: number;
  y?: number;
  visible?: boolean;
}

interface DialoguePlayerProps {
  script: DialogueLine[];
  inputFlow?: DialogueLine[];
  onComplete: () => void;
  onAction?: (action: string) => void;
  onInputSubmit?: (input: SajuInput) => void;
  onBgChange?: (bg: ZoneBg) => void;
  onDotMove?: (state: DotMoveState) => void;
  onScreenEffect?: (effect: 'shake' | 'flash' | null) => void;
}

const SUN_PATH = [
  { direction: 'left' as const,  x: 40, y: 62, duration: 400 },
  { direction: 'back' as const,  x: 40, y: 56, duration: 500 },
  { direction: 'left' as const,  x: 31, y: 56, duration: 400 },
  { direction: 'back' as const,  x: 31, y: 46, duration: 600 },
  { direction: 'right' as const, x: 37, y: 46, duration: 300 },
  { direction: 'back' as const,  x: 37, y: 38, duration: 500 },
  { direction: 'left' as const,  x: 32, y: 38, duration: 300 },
  { direction: 'back' as const,  x: 32, y: 32, duration: 400 },
];

const MOON_PATH = [
  { direction: 'right' as const, x: 58, y: 62, duration: 400 },
  { direction: 'back' as const,  x: 58, y: 54, duration: 500 },
  { direction: 'right' as const, x: 63, y: 54, duration: 300 },
  { direction: 'back' as const,  x: 63, y: 44, duration: 600 },
];

const FIELD_MAP: Record<string, string> = {
  input_name: 'name',
  input_gender: 'gender',
  input_calendar: 'calendar',
  input_birthdate: 'birthDate',
  input_leapmonth: 'isLeapMonth',
  input_birthtime: 'birthTime',
  input_birthcity: 'birthCity',
};

const INPUT_TYPE_MAP: Record<string, InputType> = {
  input_name: 'text',
  input_gender: 'gender',
  input_calendar: 'calendar',
  input_birthdate: 'date',
  input_leapmonth: 'leapmonth',
  input_birthtime: 'time',
  input_birthcity: 'city',
};

function buildSajuInput(collected: Record<string, string>): SajuInput {
  return {
    birthDate: collected.birthDate || '',
    birthTime: collected.birthTime || '',
    calendar: (collected.calendar || 'solar') as 'solar' | 'lunar',
    isLeapMonth: collected.isLeapMonth === 'true',
    birthCity: collected.birthCity || '서울',
    gender: (collected.gender || '') as 'M' | 'F' | '',
    name: collected.name || '',
  };
}

export default function DialoguePlayer({
  script,
  inputFlow,
  onComplete,
  onAction,
  onInputSubmit,
  onBgChange,
  onDotMove,
  onScreenEffect,
}: DialoguePlayerProps) {
  const [mode, setMode] = useState<'dialogue' | 'input'>('dialogue');
  const [lineIndex, setLineIndex] = useState(0);
  const [inputLineIndex, setInputLineIndex] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [responseLines, setResponseLines] = useState<DialogueLine[]>([]);
  const [collectedInput, setCollectedInput] = useState<Record<string, string>>({});
  const [dynamicInsertQueue, setDynamicInsertQueue] = useState<DialogueLine[]>([]);
  const [birthdateStepIndex, setBirthdateStepIndex] = useState(-1);
  const [pendingTempleWalk, setPendingTempleWalk] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const bgPastFiredRef = useRef(false);

  // Determine active script and index
  const isProcessingDynamic = dynamicInsertQueue.length > 0;
  const activeScript = mode === 'dialogue' ? script : (inputFlow || []);
  const activeIndex = mode === 'dialogue' ? lineIndex : inputLineIndex;
  const currentLine = isProcessingDynamic ? dynamicInsertQueue[0] : activeScript[activeIndex];

  if (!currentLine) return null;

  // Resolve display name
  let displayName = currentLine.name;
  if (!displayName) {
    const src = mode === 'dialogue' ? script : (inputFlow || []);
    const idx = mode === 'dialogue' ? lineIndex : inputLineIndex;
    for (let i = idx - 1; i >= 0; i--) {
      if (src[i]?.name) { displayName = src[i].name; break; }
    }
  }
  // Template variable substitution
  let processedText = currentLine.text;
  if (processedText.includes('{{birthdate_display}}')) {
    const cal = collectedInput.calendar === 'lunar' ? '음력' : '양력';
    const bd = collectedInput.birthDate || '';
    const [y, m, d] = bd.split('-');
    const display = bd ? `${cal} ${y}년 ${parseInt(m)}월 ${parseInt(d)}일` : '';
    processedText = processedText.replace(/\{\{birthdate_display\}\}/g, display);
  }
  const lineWithName = { ...currentLine, name: displayName, text: processedText };

  // Check if current line's action is an input action
  const isInputAction = !!(currentLine.action && INPUT_TYPE_MAP[currentLine.action]);

  // --- Handlers ---

  const advanceInputFlow = useCallback(() => {
    setShowResponse(false);
    setResponseLines([]);

    // If processing dynamic queue, consume it
    if (dynamicInsertQueue.length > 0) {
      setDynamicInsertQueue(prev => prev.slice(1));
      setTypingDone(false);
      setShowInput(false);
      return;
    }

    const nextIndex = inputLineIndex + 1;
    if (nextIndex < (inputFlow?.length || 0)) {
      setInputLineIndex(nextIndex);
      setTypingDone(false);
      setShowInput(false);
    }
  }, [inputLineIndex, inputFlow, dynamicInsertQueue]);

  const handleTypingComplete = useCallback(() => {
    setTypingDone(true);
    const action = currentLine.action;

    if (action === 'show_choices' && currentLine.choices) {
      setShowChoices(true);
    } else if (action && INPUT_TYPE_MAP[action]) {
      setShowInput(true);
    } else if (action === 'submit_and_transition') {
      onInputSubmit?.(buildSajuInput(collectedInput));
    } else if (action === 'bg_past') {
      if (bgPastFiredRef.current) return; // 중복 실행 방지
      bgPastFiredRef.current = true;
      setIsWalking(true);
      onDotMove?.({ visible: false });
      (async () => {
        // 1. 흔들림 시작
        onScreenEffect?.('shake');
        await delay(600);
        // 2. 백색 플래시
        onScreenEffect?.('flash');
        await delay(300);
        // 3. 플래시 중에 배경 전환
        onBgChange?.('past');
        await delay(500);
        // 4. 이펙트 해제
        onScreenEffect?.(null);
        await delay(200);
        // 5. 다음 라인으로 진행 후 대화창 복귀
        advanceInputFlow();
        setIsWalking(false);
      })();
    }
  }, [currentLine, collectedInput, onInputSubmit, onBgChange, onDotMove, onScreenEffect]);

  const handleResponseTypingComplete = useCallback(() => {
    setTypingDone(true);
  }, []);

  const handleTap = useCallback(() => {
    if (isWalking) return;
    if (showChoices || showInput) return;

    if (showResponse) {
      if (pendingTempleWalk) {
        setPendingTempleWalk(false);
        setIsWalking(true);
        setShowResponse(false);
        setResponseLines([]);
        // Temple entry sequence
        (async () => {
          const calendar = collectedInput.calendar;
          const path = calendar === 'lunar' ? MOON_PATH : SUN_PATH;

          onDotMove?.({ direction: 'back' });
          await delay(300);

          for (const step of path) {
            onDotMove?.({ direction: step.direction });
            await delay(100);
            onDotMove?.({ x: step.x, y: step.y });
            await delay(step.duration);
          }

          onDotMove?.({ visible: false });
          onBgChange?.('blackout');
          await delay(800);

          onBgChange?.(calendar === 'lunar' ? 'inside_moon' : 'inside_sun');
          await delay(500);

          onDotMove?.({ direction: 'front', x: 50, y: 60, visible: true });
          setIsWalking(false);
          advanceInputFlow();
        })();
        return;
      }
      advanceInputFlow();
      return;
    }

    if (mode === 'dialogue') {
      if (currentLine.action && currentLine.action !== 'show_choices') {
        onAction?.(currentLine.action);
      }
      if (lineIndex < script.length - 1) {
        setLineIndex(prev => prev + 1);
        setTypingDone(false);
        setShowChoices(false);
      } else {
        onComplete();
      }
    } else {
      // Input mode: isInputAction이거나 submit_and_transition이면 탭으로 진행 불가
      if (!isInputAction && currentLine.action !== 'submit_and_transition' && currentLine.action !== 'show_choices') {
        advanceInputFlow();
      }
    }
  }, [
    isWalking, showChoices, showInput, showResponse, mode, currentLine, pendingTempleWalk,
    lineIndex, script, isInputAction, collectedInput, onAction, onComplete, onBgChange, onDotMove, advanceInputFlow,
  ]);

  const handleChoiceSelect = useCallback((action: string) => {
    setShowChoices(false);
    if (action === 'start_input_flow') {
      setMode('input');
      setInputLineIndex(0);
      setTypingDone(false);
      return;
    }
    if (action === 'submit_and_transition') {
      onInputSubmit?.(buildSajuInput(collectedInput));
      return;
    }
    if (action === 'confirm_birthdate') {
      // past.jpeg에서 날짜 확인 완료 → 다음으로 진행
      if (mode === 'input') {
        advanceInputFlow();
      }
      return;
    }
    if (action === 'retry_birthdate') {
      if (birthdateStepIndex >= 0) {
        setInputLineIndex(birthdateStepIndex);
        setTypingDone(false);
        setShowInput(false);
        // calendar는 유지, birthDate와 isLeapMonth만 초기화
        setCollectedInput(prev => {
          const { birthDate, isLeapMonth, ...rest } = prev;
          return rest;
        });
        // 신전 내부로 복귀
        const calendar = collectedInput.calendar;
        onBgChange?.(calendar === 'lunar' ? 'inside_moon' : 'inside_sun');
        onDotMove?.({ direction: 'front', x: 50, y: 60, visible: true });
      }
      return;
    }
    if (action === 'continue') {
      if (mode === 'dialogue') {
        if (lineIndex < script.length - 1) {
          setLineIndex(prev => prev + 1);
          setTypingDone(false);
        } else {
          onComplete();
        }
      } else {
        advanceInputFlow();
      }
    } else {
      onAction?.(action);
    }
  }, [lineIndex, script.length, mode, birthdateStepIndex, collectedInput, onAction, onComplete, onBgChange, onDotMove, advanceInputFlow]);

  const handleDialogueInput = useCallback((value: string) => {
    const action = currentLine.action || '';

    // Update collected input
    const updated = { ...collectedInput };

    if (action === 'input_birthdate') {
      // Combined value: "solar|1986-09-15" or "lunar|1986-09-15"
      const pipeIdx = value.indexOf('|');
      if (pipeIdx > 0) {
        updated.calendar = value.slice(0, pipeIdx);
        updated.birthDate = value.slice(pipeIdx + 1);
      } else {
        updated.birthDate = value;
      }
      setBirthdateStepIndex(inputLineIndex);
      setPendingTempleWalk(true);
    } else {
      const field = FIELD_MAP[action];
      if (field) updated[field] = value;
    }

    setCollectedInput(updated);
    setShowInput(false);

    // 성별 입력 후 배경 전환
    if (action === 'input_gender') {
      onBgChange?.('after');
    }

    // Find response
    const responseKey = currentLine.responses?.[value]
      ? value
      : currentLine.responses?.['_any']
      ? '_any'
      : null;

    if (responseKey && currentLine.responses?.[responseKey]) {
      const resp = currentLine.responses[responseKey];
      const text = resp.text.replace(/\{\{value\}\}/g, value);
      setResponseLines([{ ...resp, text } as DialogueLine]);
      setShowResponse(true);
      setTypingDone(false);
    } else {
      // Check for dynamic leap month insertion
      if (action === 'input_birthdate' && updated.calendar === 'lunar') {
        const [yearStr, monthStr] = (updated.birthDate || '').split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        if (year && month && hasLeapMonth(year, month)) {
          setDynamicInsertQueue([{
            character: 'magician',
            text: `음... ${month}월이라 했나?\n혹시 윤달이었나?`,
            action: 'input_leapmonth',
            inputConfig: { skipLabel: '아니오, 평달이었어요', skipValue: 'false' },
            responses: {
              'true': { character: 'flash', text: '윤달이었군!\n달의 흐름이 한 번 더 겹친 때에 태어났어.' },
              'false': { character: 'doin', text: '평달이군.\n좋아, 그대로 진행하지.' },
              '_skip': { character: 'doin', text: '평달이군.\n좋아, 그대로 진행하지.' },
            },
          }]);
          setTypingDone(false);
          return;
        }
      }
      advanceInputFlow();
    }
  }, [currentLine, collectedInput, inputLineIndex, advanceInputFlow]);

  const handleDialogueSkip = useCallback(() => {
    const action = currentLine.action || '';
    const field = FIELD_MAP[action];
    const skipValue = currentLine.inputConfig?.skipValue || '';

    if (field && skipValue) {
      setCollectedInput(prev => ({ ...prev, [field]: skipValue }));
    }

    setShowInput(false);

    if (currentLine.responses?.['_skip']) {
      const resp = currentLine.responses['_skip'];
      setResponseLines([{ ...resp } as DialogueLine]);
      setShowResponse(true);
      setTypingDone(false);
    } else {
      advanceInputFlow();
    }
  }, [currentLine, advanceInputFlow]);

  // --- Render ---

  const showIndicator = typingDone && !showChoices && !showInput && !isInputAction;

  return (
    <div className="fixed inset-0 flex flex-col justify-end" style={{ zIndex: 10 }}>
      {/* Tap area */}
      <div className="flex-1" onClick={handleTap} />

      {!isWalking && (
        <div
          className="w-full max-w-[440px] mx-auto space-y-2"
          style={{
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
            paddingLeft: 38,
            paddingRight: 38,
          }}
        >
          {/* Choice panel */}
          {showChoices && currentLine.choices && (
            <ChoicePanel choices={currentLine.choices} onSelect={handleChoiceSelect} />
          )}

          {/* Input panel */}
          {showInput && currentLine.action && INPUT_TYPE_MAP[currentLine.action] && (
            <DialogueInput
              type={INPUT_TYPE_MAP[currentLine.action]}
              config={currentLine.inputConfig}
              onSubmit={handleDialogueInput}
              onSkip={currentLine.inputConfig?.skipLabel ? handleDialogueSkip : undefined}
            />
          )}

          {/* Dialogue box */}
          <DialogueBox
            key={showResponse ? `resp-${inputLineIndex}-${dynamicInsertQueue.length}` : `${mode}-${activeIndex}-${dynamicInsertQueue.length}`}
            line={showResponse ? responseLines[0] : lineWithName}
            typing
            onTypingComplete={showResponse ? handleResponseTypingComplete : handleTypingComplete}
            onTap={handleTap}
            showIndicator={showResponse ? typingDone : showIndicator}
          />
        </div>
      )}
    </div>
  );
}
