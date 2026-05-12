
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.products
  SET 
    rating = (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM public.reviews r WHERE r.product_id = COALESCE(NEW.product_id, OLD.product_id)),
    reviews_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.product_id = COALESCE(NEW.product_id, OLD.product_id)),
    updated_at = now()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_rating();
