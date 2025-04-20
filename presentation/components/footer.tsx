import { APP_NAME } from '@/lib/constants';
import { ReactElement } from 'react';

const Footer = (): ReactElement => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='border-t'>
      <div className='p-5 flex-center'>
        {currentYear} {APP_NAME}. All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;
