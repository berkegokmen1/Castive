const mongoose = require('mongoose');

const listSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 25,
    },
    cover: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      default: undefined,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100,
    },
    private: {
      type: Boolean,
      default: false,
    },
    items: {
      type: [String],
      default: [],
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
    id: false,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

/******************************
 * INDEXES
 ******************************/

listSchema.index(
  { title: 'text', description: 'text' },
  {
    name: 'list_search_text_index',
    weights: { title: 10, description: 1 },
  }
);

/******************************
 * SCHEMA METHODS
 ******************************/

listSchema.static('search', async function (q, id) {
  const l = this;

  const searchPartial = async (q) => {
    return await l
      .find({
        title: new RegExp(q, 'gi'),
        private: false,
      })
      .populate({
        path: 'owner',
        select: 'blocked -_id',
      })
      .limit(25)
      .lean()
      .select('_id title owner')
      .exec();
  };

  const searchFull = async (q) => {
    return await l
      .find(
        {
          $text: {
            $search: q,
            $caseSensitive: false,
            $diacriticSensitive: false,
          },
          private: false,
        },
        { score: { $meta: 'textScore' } }
      )
      .populate({
        path: 'owner',
        select: 'blocked -_id',
      })
      .limit(25)
      .lean()
      .select('_id title owner')
      .sort({ score: { $meta: 'textScore' } })
      .exec();
  };

  try {
    let data;
    data = await searchFull(q);

    if (!data) {
      data = await searchPartial(q);
    }
    if (data.length === 0) {
      data = await searchPartial(q);
    }

    // Filter out the results in which user is blocked by the list owner
    data = data.filter((d) => d.owner.blocked.indexOf(id) === -1);
    data = data.map((d) => {
      const { owner, ...rest } = d;
      return rest;
    });

    return data;
  } catch (error) {
    throw error;
  }
});

/******************************
 * FOLLOWER METHODS
 ******************************/

listSchema.virtual('followers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'library',
  options: {
    sort: {
      createdAt: -1,
    },
  },
});

listSchema.virtual('numFollowers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'library',
  count: true,
});

const List = mongoose.model('List', listSchema);

module.exports = List;
