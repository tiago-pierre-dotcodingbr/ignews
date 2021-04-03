import { GetServerSideProps } from "next";
import { Session } from "next-auth";

import { getSession, useSession } from "next-auth/client";
import { useRouter } from "next/dist/client/router";
import Head from "next/head";
import { RichText } from "prismic-dom";
import { useEffect } from "react";
import { getPrismicClient } from "../../services/prismic";

import styles from "./post.module.scss";

interface PostProps {
  post: {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
  };
}

interface SessionCustomProps extends Session {
  activeSubscription: object;
}

export default function Post({ post }: PostProps) {
  const [session] = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!(session as SessionCustomProps)?.activeSubscription) {
      router.push(`/posts/preview/${post.slug}`);
    }
  }, [session]);

  return (
    <>
      <Head>
        <title>{post.title} - Ignews</title>
      </Head>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.title}</h1>
          <time>{post.updatedAt}</time>
          <div
            className={styles.postContent}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  params,
}) => {
  const session = await getSession({ req });

  const { slug } = params;

  if (!(session as SessionCustomProps)?.activeSubscription) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const prismic = getPrismicClient(req);

  const response = await prismic.getByUID("ublication", String(slug), {});

  const post = {
    slug,
    title: RichText.asText(response.data.title),
    content: RichText.asHtml(response.data.content),
    updatedAt: new Date(response.last_publication_date).toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ),
  };

  return { props: { post } };
};
