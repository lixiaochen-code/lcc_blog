import nextra from "nextra";

const withNextra = nextra({
  search: {
    codeblocks: false
  },
  defaultShowCopyCode: true
});

export default withNextra({
  reactStrictMode: true
});
