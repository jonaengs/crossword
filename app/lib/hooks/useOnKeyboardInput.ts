import { RefObject, useEffect } from 'react';
import { AnyInput, translateKeyboardInput } from '../input';

function useOnKeyboardInput(
  handleInput: (input: AnyInput) => void,
  keyboardCaptureAreaRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const element = keyboardCaptureAreaRef.current;
    if (!element) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      const input = translateKeyboardInput(event);
      if (input === null) {
        return;
      }
      event.preventDefault();
      handleInput(input);
    }
    element.addEventListener('keydown', onKeyDown);
    return () => {
      element.removeEventListener('keydown', onKeyDown);
    };
  }, [handleInput, keyboardCaptureAreaRef]);
}

export default useOnKeyboardInput;
