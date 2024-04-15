import React from "react";
import Image from "next/image";

interface Props {
  title: string;
  iconSrc: string;
  value: string;
  borderColor: string;
}

const PriceInfoCard = ({ title, iconSrc, value, borderColor }: Props) => {
  return (
    <div className={`price-info_card border-1[${borderColor}]`}>
      <p className='text-base text-black-100'>{title}</p>
      <div className='flex gap1'>
        <Image src={iconSrc} alt={title} width={16} height={16} />

        <p className='text-2xl font-bold text-secondary'>{value}</p>
      </div>
    </div>
  );
};

export default PriceInfoCard;
