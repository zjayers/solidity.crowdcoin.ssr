import styles from "../styles/Home.module.css";
import Head from "../components/Head/Head";

export default function Home() {
  return (
    <div className={styles.container}>
      <Head />

      <main className={styles.main}></main>

      <footer className={styles.footer}></footer>
    </div>
  );
}
