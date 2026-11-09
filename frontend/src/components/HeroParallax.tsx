import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { Link } from "react-router-dom";

export type ParallaxProduct = {
  title: string;
  link: string;
  thumbnail: string;
};

export const HeroParallax = ({
  products,
  title,
  subtitle,
}: {
  products: ParallaxProduct[];
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), springConfig);
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, -1000]), springConfig);
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [15, 0]), springConfig);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), springConfig);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), springConfig);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-700, 500]), springConfig);

  return (
    <div
      ref={ref}
      className="relative flex h-[300vh] flex-col self-auto overflow-hidden py-40 antialiased [perspective:1000px] [transform-style:preserve-3d]"
    >
      <Header title={title} subtitle={subtitle} />
      <motion.div style={{ rotateX, rotateZ, translateY, opacity }}>
        <motion.div className="mb-20 flex flex-row-reverse space-x-20 space-x-reverse">
          {firstRow.map((product) => (
            <ProductCard product={product} translate={translateX} key={product.title} />
          ))}
        </motion.div>
        <motion.div className="mb-20 flex flex-row space-x-20">
          {secondRow.map((product) => (
            <ProductCard product={product} translate={translateXReverse} key={product.title} />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-20 space-x-reverse">
          {thirdRow.map((product) => (
            <ProductCard product={product} translate={translateX} key={product.title} />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

const Header = ({ title, subtitle }: { title?: React.ReactNode; subtitle?: React.ReactNode }) => {
  return (
    <div className="relative left-0 top-0 mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 md:py-32">
      <h2 className="text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
        {title ?? "Everything landlords are eased with"}
      </h2>
      <p className="mt-5 max-w-2xl text-base text-ink-500 md:text-lg">
        {subtitle ?? "One place for leases, rent, and tenants — instead of spreadsheets, WhatsApp groups, and manual bank reconciliation."}
      </p>
    </div>
  );
};

const ProductCard = ({
  product,
  translate,
}: {
  product: ParallaxProduct;
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{ x: translate }}
      whileHover={{ y: -20 }}
      key={product.title}
      className="group/product relative h-72 w-80 shrink-0 sm:h-96 sm:w-[28rem]"
    >
      <Link to={product.link} className="block group-hover/product:shadow-2xl">
        <img
          src={product.thumbnail}
          width={600}
          height={600}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-left-top"
          alt={product.title}
        />
      </Link>
      <div className="pointer-events-none absolute inset-0 h-full w-full bg-black opacity-0 transition-opacity duration-300 group-hover/product:opacity-80" />
      <h3 className="absolute bottom-4 left-4 right-4 text-base font-semibold text-white opacity-0 transition-opacity duration-300 group-hover/product:opacity-100 sm:text-lg">
        {product.title}
      </h3>
    </motion.div>
  );
};
