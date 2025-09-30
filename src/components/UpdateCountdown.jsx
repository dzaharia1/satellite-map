import React from 'react';
import styled from 'styled-components';

const UpdateCountdownContainer = styled.div`
  position: absolute;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  min-width: 127px;
  bottom: 0;
  left: 0;
  z-index: 1000;
  background-color: white;
  padding: 6px 12px;
  border-width: 1px 1px 0 0;
  border-color: black;

  p {
    margin: 0;
    padding: 0;
    font-size: 12px;
  }
`;

const UpdateCountdown = ({timeUntil}) => {
    return (
        <UpdateCountdownContainer>
            <p>Scanning sky in {timeUntil}</p>
        </UpdateCountdownContainer>
    )
}

export default UpdateCountdown;