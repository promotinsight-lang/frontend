const DEFAULT_FACEBOOK_GROUP_URL = 'https://www.facebook.com/promotinsight';

export const getFacebookGroupUrl = () =>
  import.meta.env.VITE_FACEBOOK_GROUP_URL || DEFAULT_FACEBOOK_GROUP_URL;

export const buildFacebookOrderRequestMessage = ({ product, application }) => {
  const productUrl =
    typeof window !== 'undefined' && product?.id
      ? `${window.location.origin}/product/${product.id}`
      : '';
  const requestId = application?.id || application?.application_id || '';

  return [
    'New product order request',
    product?.product_name ? `Product: ${product.product_name}` : '',
    product?.platform ? `Platform: ${product.platform}` : '',
    product?.country ? `Country: ${product.country}` : '',
    product?.price ? `Price: USD $${Number(product.price).toFixed(2)}` : '',
    requestId ? `Request ID: ${requestId}` : '',
    productUrl ? `Product link: ${productUrl}` : '',
    'Please check my request in PromotInsight.',
  ].filter(Boolean).join('\n');
};

export const copyTextToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
};

export const openFacebookGroupContact = async ({ product, application }) => {
  const message = buildFacebookOrderRequestMessage({ product, application });
  const copied = await copyTextToClipboard(message);
  window.open(getFacebookGroupUrl(), '_blank', 'noopener,noreferrer');
  return copied;
};
