import Link from 'next/link';
import Image from 'next/image';

import styles from './styles.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={styles.container}>
      <div className={styles.content}>
        <Link href="/">
          <a>
            <Image
              src="/images/logo.svg"
              alt="logo"
              height={25.63}
              width={238.62}
            />
          </a>
        </Link>
      </div>
    </header>
  );
}
