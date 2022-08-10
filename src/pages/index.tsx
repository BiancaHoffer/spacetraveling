import { useState } from 'react';

import { GetStaticProps } from 'next';

import Link from 'next/link';
import Head from 'next/head';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';
import commonStyles from '../styles/common.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const formattedDate = postsPagination.results.map(posts => {
    return {
      ...posts,
      first_publication_date: format(
        new Date(posts.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });

  const [posts, setPosts] = useState<Post[]>(formattedDate);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleNextPost(): Promise<void> {
    if (nextPage === null && currentPage !== 1) {
      return;
    }

    const postsResults = await fetch(nextPage).then(response =>
      response.json()
    );

    setNextPage(postsResults.next_page);
    setCurrentPage(postsResults.page);

    const newPosts = postsResults.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title> Home | Spacetraveling </title>
      </Head>

      <main className={styles.container}>
        <div className={styles.content}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p className={styles.subtitle}>{post.data.subtitle}</p>
                <div>
                  <FiCalendar size={18} color="##D7D7D7" />
                  <time>{post.first_publication_date}</time>

                  <FiUser size={18} color="##D7D7D7" />
                  <p>{post.data.author}</p>
                </div>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button type="button" onClick={handleNextPost}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismicClient = getPrismicClient({});

  const response = await prismicClient.getByType('posts', {
    orderings: {
      field: 'document.first_publication_date',
      direction: 'desc',
    },
    fetch: ['posts'],
    pageSize: 2,
    page: 1,
  });

  const posts = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const { next_page } = response;

  const postsPagination: PostPagination = { next_page, results: posts };

  // console.log(JSON.stringify(response, null, 2));

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 60 * 24,
  };
};
