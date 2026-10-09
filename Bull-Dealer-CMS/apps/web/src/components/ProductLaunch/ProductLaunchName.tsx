import "./ProductLaunch.css";
export function ProductLaunchName({ name }: { name: string }) {
  const supersmart = /super\s*smart/i.test(name);
  const redX = /grandia.*dlx\s*$/i.test(name);
  const lastX = redX ? name.toUpperCase().lastIndexOf("X") : -1;
  return <span className={"product-launch-name" + (supersmart ? " supersmart" : "")}>
    {lastX >= 0 ? <>{name.slice(0, lastX)}<span className="x-red">{name[lastX]}</span>{name.slice(lastX + 1)}</> : name}
  </span>;
}
