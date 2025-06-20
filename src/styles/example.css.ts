// src/styles/example.css.ts
import { style } from '@vanilla-extract/css';

export const exampleStyle = style({
  backgroundColor: 'blue',
  color: 'white',
  padding: '10px',
  selectors: {
    '&:hover': {
      backgroundColor: 'darkblue',
    },
  },
});

export const anotherStyle = style({
  fontSize: '20px',
  fontWeight: 'bold',
});
