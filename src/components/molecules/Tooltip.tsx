import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';
import { Arrow, Placement, useHover, useLayer } from 'react-laag';
import { TP } from '@/src/components/atoms';

export const Tooltip = ({ children, text, position, offset }: { text: string; children: JSX.Element; position?: Placement; offset?: number }) => {
  const [isOver, hoverProps] = useHover({ delayEnter: 100, delayLeave: 300 });

  const { triggerProps, layerProps, arrowProps, renderLayer } = useLayer({
    auto: true,
    isOpen: isOver,
    triggerOffset: offset || 12,
    placement: position || 'bottom-start',
    preferY: position ? undefined : 'bottom',
  });

  return (
    <>
      {React.cloneElement(children, {
        ...triggerProps,
        ...hoverProps,
      })}
      {renderLayer(
        <AnimatePresence>
          {isOver && (
            <StyledTooltip
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.1 }}
              {...layerProps}
            >
              <TP size="1.25rem">{text}</TP>
              <StyledArrow
                {...(arrowProps as any)}
                size={6}
              />
            </StyledTooltip>
          )}
        </AnimatePresence>,
      )}
    </>
  );
};

const StyledArrow = styled(Arrow)``;

const StyledTooltip = styled(motion.div)`
    max-width: 20rem;

    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.text.main};
    font-weight: 400;
    padding: 0.4rem 0.8rem;
    border-radius: 0.4rem;
    background-color: ${({ theme }) => theme.gray(0)};
    box-shadow: 0px 4px 16px ${({ theme }) => theme.shadow};
`;
