import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "../../auth";
import { getCurrentSession } from "../../lib/auth";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

async function loginAction(formData: FormData) {
  "use server";

  const email = formData.get("email");
  const password = formData.get("password");

  try {
    await signIn("credentials", {
      email: typeof email === "string" ? email : "",
      password: typeof password === "string" ? password : "",
      redirect: false
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=${encodeURIComponent(error.type)}`);
    }

    if (error instanceof Error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    throw error;
  }

  redirect("/admin/documents");
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();

  if (session?.user?.id) {
    redirect("/admin/documents");
  }

  const { error } = await searchParams;

  return (
    <div className="error-layout">
      <section className="error-card auth-card">
        <h1>登录后台</h1>
        <p>使用 Auth.js credentials provider 接入基础会话能力。</p>
        <form action={loginAction} className="auth-form">
          <label>
            <span>Email</span>
            <input name="email" type="email" defaultValue="admin@example.com" />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" defaultValue="admin123" />
          </label>
          <button className="button-link button-link--primary" type="submit">
            登录
          </button>
        </form>
        {error ? <p className="auth-error">登录失败：{error}</p> : null}
        <p className="auth-hint">
          示例账号：admin@example.com / admin123，user@example.com / user123
        </p>
      </section>
    </div>
  );
}
