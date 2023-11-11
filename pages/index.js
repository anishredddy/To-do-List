import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import EightBall from './EightBall';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>To Do List</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <EightBall />
    </div>
  )
}
