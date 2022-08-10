import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import * as prismicH from '@prismicio/helpers';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
    banner: {
      url: string;
    };
    content: {
      heading: string | null;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const formattedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  function readingTime(content): string {
    const text = content
      .map(item => {
        return prismicH.asText(item.body).split(' ');
      })
      .filter(i => i !== '')
      .reduce((acc, curr) => [...curr, ...acc], []);

    const min = Math.ceil(text.length / 200);

    return `${min} min`;
  }

  return (
    <>
      <Head>
        <title> {`Spacetraveling | ${post.data.title}`}</title>
      </Head>

      {router.isFallback ? (
        <div className={styles.loading}>Carregando...</div>
      ) : (
        <main className={styles.container}>
          <img src={post.data.banner.url} alt="banner" />
          <div className={styles.content}>
            <h1>{post.data.title}</h1>
            <div>
              <FiCalendar size={18} />
              <time>{formattedDate}</time>

              <FiUser size={18} />
              <p>{post.data.author}</p>

              <FiClock size={18} />
              <p>{readingTime(post.data.content)}</p>
            </div>

            <article>
              {post.data.content.map(content => {
                return (
                  <div key={content.heading}>
                    <h2>{content.heading}</h2>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: prismicH.asHTML(content.body),
                      }}
                    />
                  </div>
                );
              })}
            </article>
          </div>
        </main>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts', {});

  const paths = posts.results.map(post => {
    return { params: { slug: post.uid } };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug), {});

  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: prismicH.asImageSrc(response.data.banner),
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  // console.log(JSON.stringify(response, null, 2));

  return {
    props: {
      post,
    },
  };
};
