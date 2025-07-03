export function registerRatingHooks(service: any, Ratings: any) {
  service.before(["CREATE", "UPDATE"], Ratings, async (req: any) => {
    const rating = req.data.ratings;
    if (rating < 1 || rating > 5) {
      req.reject(400, "Rating must be between 1 and 5.");
    }
  });

  service.on("DELETE", Ratings, async (req: any) => {
    const result = await DELETE.from(Ratings).where({ ID: req.data.ID });
    if (!result) req.reject(404, "Rating not found.");
  });
}
