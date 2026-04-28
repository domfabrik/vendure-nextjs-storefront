import styled from '@emotion/styled';
import { arrow, autoUpdate, flip, offset, Placement, shift, useFloating, useHover, useInteractions } from '@floating-ui/react';
import { AnimatePresence, motion } from 'motion/react';
import { ReactElement, useRef, useState } from 'react';
import { TP } from '@/src/components/atoms';

export const Tooltip = ({ children, text, position, offset: offsetValue }: { text: string; children: ReactElement; position?: Placement; offset?: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef<HTMLDivElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: position || 'bottom-start',
    middleware: [offset(offsetValue || 12), flip(), shift(), arrow({ element: arrowRef })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { delay: { open: 100, close: 300 } });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      <span
        ref={refs.setReference}
        style={{ display: 'inline-flex' }}
        {...getReferenceProps()}
      >
        {children}
      </span>
      <AnimatePresence>
        {isOpen && (
          <StyledTooltip
            ref={refs.setFloating}
            style={floatingStyles}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.1 }}
            {...getFloatingProps()}
          >
            <TP size="1.25rem">{text}</TP>
            <StyledArrow ref={arrowRef} />
          </StyledTooltip>
        )}
      </AnimatePresence>
    </>
  );
};

const StyledArrow = styled.div`
    position: absolute;
    width: 8px;
    height: 8px;
    background: inherit;
    transform: rotate(45deg);
`;

const StyledTooltip = styled(motion.div)`
    max-width: 20rem;
    z-index: 1000;

    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.text.main};
    font-weight: 400;
    padding: 0.4rem 0.8rem;
    border-radius: 0.4rem;
    background-color: ${({ theme }) => theme.gray(0)};
    box-shadow: 0 4px 16px ${({ theme }) => theme.shadow};
`;
