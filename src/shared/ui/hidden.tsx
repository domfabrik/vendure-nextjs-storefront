import { Box, SxProps } from '@mui/material';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  mobile?: boolean;
  desktop?: boolean;
  display?: string;
  sx?: SxProps;
}

export function Hidden(props: Props) {
  return (
    <Box
      sx={{
        display: {
          lg: props.desktop ? 'none' : props.display || 'block',
          md: props.mobile ? 'none' : props.display || 'block',
          sm: props.mobile ? 'none' : props.display || 'block',
          xl: props.desktop ? 'none' : props.display || 'block',
          xs: props.mobile ? 'none' : props.display || 'block',
          xxl: props.desktop ? 'none' : props.display || 'block',
          xxxl: props.desktop ? 'none' : props.display || 'block',
        },

        ...props.sx,
      }}
    >
      {props.children}
    </Box>
  );
}
